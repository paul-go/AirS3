
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
		get(options: IRequest)
		{
			return this.call("GET", options);
		}
		
		/**
		 * 
		 */
		post(options: IRequest)
		{
			return this.call("POST", options);
		}
		
		/**
		 * 
		 */
		put(options: IRequest)
		{
			return this.call("PUT", options);
		}
		
		/**
		 * 
		 */
		delete(options: IRequest)
		{
			return this.call("DELETE", options);
		}
		
		/**
		 * 
		 */
		async call(method: string, options: IRequest)
		{
			options.method = method;
			
			if (options.body)
				if (typeof options.body === "object")
					if (options.body.constructor === Object)
						options.body = S3XmlConverter.fromJson(options.body as S3XmlJsonObject);
			
			const optionsSigned = await AirS3.sign(this.configuration, options);
			
			const queryText = Object.entries(optionsSigned.query)
				.map(([k, v]) => k + "=" + v)
				.join("&");
			
			const url = 
				this.configuration.protocol + "://" +
				optionsSigned.headers["host"] +
				optionsSigned.key + 
				(queryText ? "?" + queryText : "");
			
			const networkRequest: INetworkRequest = {
				url,
				method: optionsSigned.method,
				headers: optionsSigned.headers,
				body: optionsSigned.body as BodyInit,
				retryCount: optionsSigned.retryCount
			};
			
			const response = await Network.beginRequest(networkRequest);
			
			if (response instanceof NetworkResponse)
			{
				response;
			}
			else
			{
				debugger;
			}
		}
	}
	
	declare var module: any;
	if (typeof module === "object")
		module.exports = { AirS3 };
}
