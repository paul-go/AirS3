
namespace AirS3
{
	/**
	 * @internal
	 */
	export async function presign(
		config: IConfiguration,
		options: IPresignOptions)
	{
		if (!options.query)
				options.query = {};
		
		const dates = Util.getDatePair();
		const region = options.region || Const.defaultRegion;
		const scope = constructScope(dates.calendarDate, region);
		const credential = constructCredential(config.accessKey, scope);
		const signedHeaders = "host";
		
		const expires = options.expiresIn || 3600;
		options.query[Const.queryAlgorithm] = Const.algorithm;
		options.query[Const.queryCredential] = encodeURIComponent(credential);
		options.query[Const.queryDate] = dates.fullDate;
		options.query[Const.queryExpires] = expires.toString();
		options.query[Const.querySignedHeaders] = signedHeaders;
		
		const signed = await AirS3.sign(config, options);
		return signed;
	}
	
	/**
	 * @internal
	 */
	export async function sign(
		config: IConfiguration,
		options: IRequestOptions)
	{
		const req: Required<IRequestOptions> = {
			method: options.method || "GET",
			bucket: (options.bucket || "").toLowerCase(),
			key: options.key || "/",
			query: options.query || {},
			endpoint: options.endpoint || "",
			region: options.region || Const.defaultRegion,
			headers: options.headers || {},
			body: options.body || "",
			retryCount: options.retryCount || 0,
		};
		
		if (!req.key.startsWith("/"))
			req.key = "/" + req.key;
		
		let host = req.headers["host"] || config.host || Host.airbox;
		
		// The region, if it's not us-east-1, is wedged between the last two
		// segments of the host name. This is a bit awkward, but there isn't
		// a standard place where the region is inserted. If there are S3 vendors
		// that don't work like this, these will have to be individually special-cased.
		if (req.region !== "us-east-1")
		{
			const hostParts = host.split(".");
			hostParts.splice(-2, 0, req.region);
			host = hostParts.join(".");
		}
		
		if (req.bucket)
		{
			if (config.usePathStyle)
				req.key = "/" + req.bucket + req.key;
			else
				host = req.bucket + "." + host;
		}
		
		req.headers["host"] = host;
		const isPresigning = !!req.query[Const.queryAlgorithm];
		let dates = Util.getDatePair();
		
		if (!isPresigning)
		{
			if (Const.queryDate in req.query)
			{
				const queryDate = req.query[Const.queryDate].toString();
				dates = Util.parseDate(queryDate);
			}
			
			req.headers["x-amz-date"] = dates.fullDate;
			
			if (!req.headers["x-amz-content-sha256"])
				req.headers["x-amz-content-sha256"] = Const.unsigned;
		}
		
		/*
		// Some endpoints require md5 signature (deleteObjects, maybe others)
		if (method === "POST" || method === "PUT")
			if (!req.headers["content-md5"])
				if (typeof body === "string")
					req.headers["content-md5"] = Util.calculateMd5(body);
		*/
		
		const payloadSignature = Const.unsigned;
		const headersSigned = ["host"];
		
		for (const n of Object.keys(req.headers))
		{
			const headerName = n as keyof IHttpHeaders;
			if (headerName.startsWith("x-amz"))
				if (!headersSigned.includes(headerName))
					headersSigned.push(headerName);
		}
		
		const signedHeadersLine = headersSigned.sort().join(";");
		if (signedHeadersLine === "")
			throw new Error();
		
		const signableQueryString = constructSignableQueryString(req.endpoint, req.query);
		const signedHeaderLines = constructSignedHeaderLines(headersSigned, req.headers);
		
		const canonicalString = [
			req.method,
			req.key,
			signableQueryString,
			signedHeaderLines,
			"", // Extra newline is required
			signedHeadersLine,
			payloadSignature
		].join("\n");
		
		const stringifiedRequestHash = await Crypto.shaHex(canonicalString);
		const scope = constructScope(dates.calendarDate, req.region);
		
		const stringToSign = [
			Const.algorithm,
			dates.fullDate,
			scope,
			stringifiedRequestHash
		].join("\n");
		
		const startingInput = "AWS4" + config.secretKey;
		const dateBytes = await Crypto.hmacShaBytes(startingInput, dates.calendarDate);
		const regionBytes = await Crypto.hmacShaBytes(dateBytes, req.region);
		const serviceBytes = await Crypto.hmacShaBytes(regionBytes, Const.service);
		const signatureBytes = await Crypto.hmacShaBytes(serviceBytes, Const.version);
		const requestSignature = await Crypto.hmacShaHex(signatureBytes, stringToSign);
		
		const calculatedAuthHeader = 
			Const.algorithm + " " + 
			[
				Const.credentialParam + constructCredential(config.accessKey, scope),
				Const.signedHeadersParam + signedHeadersLine,
				Const.signatureParam + requestSignature,
			].join(", ");
		
		req.headers.authorization = calculatedAuthHeader;
		
		return {
			options: req,
			signature: requestSignature
		}
	}
	
	/** */
	function constructCredential(accessKey: string, scope: string)
	{
		return accessKey + "/" + scope;
	}
	
	/** */
	function constructScope(calendarDate: string, region: string)
	{
		const credential = [
			calendarDate,
			region,
			Const.service,
			Const.version,
		].join("/");
		
		return credential;
	}
	
	/**
	 * Reconstructs the query string using the same method as is used in the AWS SDK. 
	 * We can't just use the raw query string here, because there needs to be a trailing
	 * equal sign at the end of included parameters that don't have a value.
	 */
	function constructSignableQueryString(endpoint: string, query: Query): string
	{
		const queryComponents: string[] = [];
		
		if (endpoint)
			queryComponents.push(endpoint + "=");
		
		for (const [key, value] of Object.entries(query))
		{
			const valueText = (Array.isArray(value) ? value.join(",") : value || "");
			const valueEnc = encodeURIComponent(valueText);
			const parameter = key + "=" + valueEnc;
			queryComponents.push(parameter);
		}
		
		queryComponents.sort();
		return queryComponents.join("&");
	}
	
	/**
	 * 
	 */
	function constructSignedHeaderLines(
		headersSigned: string[],
		headers: IHttpHeaders): string
	{
		const headerLines: string[] = [];
		
		for (const name of headersSigned)
		{
			const value = headers[name as keyof IHttpHeaders];
			headerLines.push(name + ":" + value);
		}
		
		return headerLines.sort().join("\n");
	}
	
	/**
	 * @internal
	 * String constants used in the request signing process.
	 */
	export const enum Const
	{
		defaultRegion = "us-east-1",
		
		service = "s3",
		version = "aws4_request",
		algorithm = "AWS4-HMAC-SHA256",
		unsigned = "UNSIGNED-PAYLOAD",
		
		credentialParam = "Credential=",
		signedHeadersParam = "SignedHeaders=",
		signatureParam = "Signature=",
		
		queryAlgorithm = "X-Amz-Algorithm",
		queryCredential = "X-Amz-Credential",
		queryDate = "X-Amz-Date",
		queryExpires = "X-Amz-Expires",
		querySignedHeaders = "X-Amz-SignedHeaders",
		querySignature = "X-Amz-Signature"
	}
}
