
namespace AirS3
{
	/**
	 * @internal
	 */
	export async function sign(
		config: IConfiguration,
		request: IRequest)
	{
		const req: Required<IRequest> = {
			method: request.method || "GET",
			bucket: request.bucket || "",
			key: request.key || "/",
			query: request.query || {},
			endpoint: request.endpoint || "",
			region: request.region || "us-east-1",
			headers: request.headers || {},
			body: request.body || "",
			retryCount: request.retryCount || 0,
		};
		
		if (!req.key.startsWith("/"))
			req.key = "/" + req.key;
		
		let host = req.headers["host"] || config.host || Host.airbox;
		
		if (req.bucket)
		{
			if (config.usePathStyle)
				req.key = "/" + req.bucket + req.key;
			else
				host = req.bucket + "." + host;
		}
		
		req.headers["host"] = host;
		
		const dates = Util.getDatePair();
		req.headers["x-amz-date"] = dates.fullDate;
		
		if (!req.headers["x-amz-content-sha256"])
			req.headers["x-amz-content-sha256"] = Const.unsigned;
		
		/*
		// Can we just not do this?
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
		
		const signableQueryString = constructSignableQueryString(req.query);
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
		
		const credential = [
			dates.calendarDate,
			req.region,
			Const.service,
			Const.version,
		].join("/");
		
		const stringToSign = [
			Const.algorithm,
			dates.fullDate,
			credential,
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
				"Credential=" + config.accessKey + "/" + credential,
				"SignedHeaders=" + signedHeadersLine,
				"Signature=" + requestSignature,
			].join(", ");
		
		req.headers.authorization = calculatedAuthHeader;		
		return req;
	}
	
	/**
	 * Reconstructs the query string using the same method as is used in the AWS SDK. 
	 * We can't just use the raw query string here, because there needs to be a trailing
	 * equal sign at the end of included parameters that don't have a value.
	 */
	function constructSignableQueryString(query: Query): string
	{
		const queryComponents: string[] = [];
		
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
	 * String constants used in the request signing process.
	 */
	const enum Const
	{
		service = "s3",
		version = "aws4_request",
		algorithm = "AWS4-HMAC-SHA256",
		unsigned = "UNSIGNED-PAYLOAD",
	}
}
