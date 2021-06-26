
namespace AirS3
{
	/**
	 * A class that handles HTTP communication with S3 endpoints.
	 */
	export class Client
	{
		/** */
		constructor(configuration: IConfiguration)
		{
			this.configuration = this.toRequiredConfiguration(configuration);
		}
		
		/**
		 * Updates the internal configuration with the values in the object specified.
		 */
		configure(configuration: IConfiguration)
		{
			this.configuration = this.toRequiredConfiguration(configuration);
		}
		
		/** */
		private toRequiredConfiguration(configuration: IConfiguration): Required<IConfiguration>
		{
			const protocol = configuration.protocol || "https";
			return {
				accessKey: configuration.accessKey,
				secretKey: configuration.secretKey,
				host: configuration.host || Host.airbox,
				protocol,
				port: configuration.port || protocol === "http" ? 80 : 443,
				usePathStyle: configuration.usePathStyle || false,
			};
		}
				
		/** */
		private configuration: Required<IConfiguration>;
		
		/**
		 * Performs an HTTP GET request to the server as specified in this Client's configuration.
		 * The request signing process happens automatically.
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
		 * Performs an HTTP HEAD request to the server as specified in this Client's configuration.
		 * The request signing process happens automatically.
		 */
		head(options: IRequestOptions)
		{
			return this.request("HEAD", options);
		}
		
		/**
		 * Performs an HTTP POST request to the server as specified in this Client's configuration.
		 * The request signing process happens automatically.
		 */
		post(options: IRequestOptions)
		{
			return this.request("POST", options);
		}
		
		/**
		 * Performs an HTTP PUT request to the server as specified in this Client's configuration.
		 * The request signing process happens automatically.
		 */
		put(options: IRequestOptions)
		{
			return this.request("PUT", options);
		}
		
		/**
		 * Performs an HTTP DELETE request to the server as specified in this Client's configuration.
		 * The request signing process happens automatically.
		 */
		delete(options: IRequestOptions)
		{
			return this.request("DELETE", options);
		}
		
		/**
		 * Performs an HTTP request with the method specified to the server as specified in this
		 * Client's configuration. The request signing process happens automatically.
		 */
		async request(method: string, options: IRequestOptions)
		{
			options.method = method;
			
			if (options.body)
				if (typeof options.body === "object")
					if (options.body.constructor === Object)
						options.body = S3XmlConverter.fromJson(options.body as S3XmlJsonObject);
			
			const signed = await AirS3.sign(this.configuration, options);
			
			// It's important that this check is done after the last "await" call, in order
			// to catch the case where the operation is stopped before the HTTP 
			// request is launched.
			if (options.stopper?.hasStopped)
				return NetworkResponse.fromError(ErrorString.terminateResponse);
			
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
			
			/*
			const nr: INetworkRequest = {
				url,
				method: signed.options.method,
				headers: signed.options.headers,
				body: signed.options.body as BodyInit,
				retryCount: signed.options.retryCount
			};
			*/
			
			// A false navigator.onLine value indicates that the internet connection is 
			// definitely not available in WebKit browsers, but a true value indicates
			// uncertainty, so it cannot be relied on entirely.
			if (navigator.onLine === false)
				return NetworkResponse.fromError(ErrorString.offlineResponse);
			
			let nr: NetworkResponse | null = null;
			
			let retryCount = 
				method !== HttpMethod.post &&
				method !== HttpMethod.put ?
					options.retryCount || 0 :
					0;
			
			while (retryCount >= 0)
			{
				const xhr = new XMLHttpRequest();
				xhr.open(options.method ?? HttpMethod.get, url);
				xhr.responseType = "blob";
				xhr.withCredentials = true;
				
				if (options.stopper)
					options.stopper.connect(xhr);
				
				for (const [name, value] of Object.entries(signed.options.headers))
					xhr.setRequestHeader(name, value);
				
				// The timeout detection is currently disabled, because the browser's 
				// implementation doesn't appear to work very well. If the request hasn't
				// completed before the prescribed amount of time (even if a download or
				// upload is in progress), the timeout handler triggers. In order to implement
				// this properly, it appears you would need to check for progress events not
				// being triggered after a particular amount of time.
				
				/*
				xhr.timeout = params.timeout ?? 5000;
				xhr.addEventListener("timeout", () =>
				{
					this.activeRequests.delete(xhr);
					callbacks.timeout();
				});
				*/
				
				const finished = await new Promise<boolean>(resolve =>
				{
					xhr.addEventListener("error", ev =>
					{
						Client.activeRequests.delete(xhr);
						nr = NetworkResponse.fromXhr(xhr);
						options.callbacks?.error?.();
						resolve(false);
					});
					
					xhr.addEventListener("timeout", ev =>
					{
						// Timeout (not currently triggered)
						if (retryCount === 0)
						{
							const e = ErrorString.timeoutResponse;
							nr = NetworkResponse.fromError(e);
							resolve(true);
						}
						else
						{
							resolve(false);
						}
					});
					
					xhr.addEventListener("abort", () =>
					{
						Client.activeRequests.delete(xhr);
						nr = NetworkResponse.fromError(ErrorString.terminateResponse);
						options.callbacks?.stop?.();
						resolve(true);
					});
					
					xhr.addEventListener("load", () =>
					{
						options.callbacks?.complete?.();
						nr = NetworkResponse.fromXhr(xhr);
						resolve(true);
					});
					
					xhr.addEventListener("progress", ev =>
					{
						options.callbacks?.progress?.(ev.loaded, ev.total);
					});
					
					xhr.upload.addEventListener("progress", ev =>
					{
						options.callbacks?.progress?.(ev.loaded, ev.total);
					});
					
					xhr.send(options.body as BodyInit);
				});
				
				retryCount--;
				
				if (finished)
					break;
			}
			
			return nr || NetworkResponse.fromError(ErrorString.genericErrorResponse);
		}
		
		/**
		 * Stops all outstanding requests.
		 */
		static stop()
		{
			const xhrs = Array.from(this.activeRequests);
			this.activeRequests.clear();
			
			for (const xhr of xhrs)
				xhr.abort();
		}
		
		/**
		 * Stores a map of all outstanding requests, which are keyed by 
		 * classifier strings.
		 */
		private static readonly activeRequests = new Set<XMLHttpRequest>();
		
		/** */
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
	}
	
	declare var module: any;
	if (typeof module === "object")
		module.exports = { AirS3 };
}
