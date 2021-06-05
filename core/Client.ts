
namespace AirS3
{
	/**
	 * 
	 */
	export class Client
	{
		/** */
		constructor(configuration: IConfiguration)
		{
			const protocol = configuration.protocol || "https";
			
			this.configuration = {
				accessKey: configuration.accessKey,
				secretKey: configuration.secretKey,
				host: configuration.host || Host.airbox,
				protocol,
				port: configuration.port || protocol === "http" ? 80 : 443,
				usePathStyle: configuration.usePathStyle || false,
			};
		}
		
		/** */
		private readonly configuration: Required<IConfiguration>;
		
		/**
		 * 
		 */
		get(options: IRequestOptions = {})
		{
			return this.request("GET", options);
		}
		
		/**
		 * Generates a pre-signed download URL for the specified 
		 */
		getPresigned(options: IPresignOptions)
		{
			return this.presign("GET", options);
		}
		
		/**
		 * 
		 */
		head(options: IRequestOptions)
		{
			return this.request("HEAD", options);
		}
		
		/**
		 * 
		 */
		post(options: IRequestOptions)
		{
			return this.request("POST", options);
		}
		
		/**
		 * 
		 */
		put(options: IRequestOptions)
		{
			return this.request("PUT", options);
		}
		
		/**
		 * 
		 */
		delete(options: IRequestOptions)
		{
			return this.request("DELETE", options);
		}
		
		/**
		 * 
		 */
		async request(method: string, options: IRequestOptions)
		{
			const networkRequest = await this.createNetworkRequest(method, options);
			const response = await Network.beginRequest(networkRequest);
			return response;
		}
		
		/**
		 * 
		 */
		private async presign(method: string, options: IPresignOptions)
		{
			options.method = method;
			
			const presigned = await AirS3.presign(this.configuration, options);
			presigned.options.query[Const.querySignature] = presigned.signature;
			
			const query = Object.entries(presigned.options.query)
				.map(([k, v]) => k + "=" + v)
				.join("&");
			
			const url =
				this.configuration.protocol + "://" +
				presigned.options.headers["host"] +
				presigned.options.key +
				"?" + query;
			
			return url;
		}
		
		/** */
		private async createNetworkRequest(method: string, options: IRequestOptions)
		{
			options.method = method;
			
			if (options.body)
				if (typeof options.body === "object")
					if (options.body.constructor === Object)
						options.body = S3XmlConverter.fromJson(options.body as S3XmlJsonObject);
			
			const signed = await AirS3.sign(this.configuration, options);
			
			const queryComponents = [
				options.endpoint,
				...Object.entries(signed.options.query).map(([k, v]) => k + "=" + v)
			];
			
			const queryText = queryComponents.join("&");
			
			const url = 
				this.configuration.protocol + "://" +
				signed.options.headers["host"] +
				signed.options.key + 
				(queryText ? "?" + queryText : "");
			
			const networkRequest: INetworkRequest = {
				url,
				method: signed.options.method,
				headers: signed.options.headers,
				body: signed.options.body as BodyInit,
				retryCount: signed.options.retryCount
			};
			
			return networkRequest;
		}
	}
	
	declare var module: any;
	if (typeof module === "object")
		module.exports = { AirS3 };
}
