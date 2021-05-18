
namespace AirS3
{
	// Delete this
	type RequestOptions = import("http").RequestOptions;
	
	/**
	 * @internal
	 */
	export interface INetworkRequest
	{
		readonly url: string;
		readonly method: string;
		readonly headers: object;
		readonly body: BodyInit;
		readonly retryCount: number;
	}
	
	/**
	 * @internal
	 */
	export class Network
	{
		/**
		 * Wraps the built-in fetch() function, providing a better way
		 * to handle failure (such as network failures).
		 */
		static beginRequest(options: INetworkRequest)
		{
			return new Promise<NetworkResponse>(resolve =>
			{
				// A false navigator.onLine value indicates that the internet connection is 
				// definitely not available in WebKit browsers, but a true value indicates
				// uncertainty, so it cannot be used.
				
				let retryCount = 
					options.method !== HttpMethod.post &&
					options.method !== HttpMethod.put ?
						options.retryCount || 0 :
						0;
				
				const attempt = () =>
				{
					this.tryRequest(options, {
						timeout: () =>
						{
							// Timeout (not currently triggered)
							if (retryCount === 0)
							{
								const e = ErrorString.timeoutResponse;
								return resolve(NetworkResponse.fromError(e));
							}
							
							retryCount--;
							attempt();
						},
						error: () =>
						{
							const e = ErrorString.noResponse;
							resolve(NetworkResponse.fromError(e));
						},
						terminate: () =>
						{
							const e = ErrorString.terminateResponse;
							resolve(NetworkResponse.fromError(e));
						},
						progress: (loaded, total) =>
						{
							// Progress
						},
						complete: response =>
						{
							resolve(response);
						}
					});
				};
				
				attempt();
			});
		}
		
		/** */
		private static tryRequest(
			options: INetworkRequest,
			callbacks: {
				timeout: () => void;
				error: () => void;
				terminate: () => void;
				progress: (loaded: number, total: number) => void;
				complete: (response: NetworkResponse) => void
			})
		{
			const xhr = new XMLHttpRequest();
			xhr.open(options.method ?? HttpMethod.get, options.url);
			xhr.responseType = "blob";
			xhr.withCredentials = true;
			
			for (const [name, value] of Object.entries(options.headers))
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
			
			xhr.addEventListener("error", e =>
			{
				this.activeRequests.delete(xhr);
				callbacks.error();
			});
			
			xhr.addEventListener("abort", () =>
			{
				this.activeRequests.delete(xhr);
				callbacks.terminate();
			});
			
			xhr.addEventListener("load", () =>
			{
				callbacks.complete(NetworkResponse.fromXhr(xhr));
			});
			
			xhr.addEventListener("progress", ev =>
			{
				callbacks.progress(ev.loaded, ev.total);
			});
			
			xhr.upload.addEventListener("progress", ev =>
			{
				callbacks.progress(ev.loaded, ev.total);
			});
			
			xhr.send(options.body as BodyInit);
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
	}
	
	/**
	 * 
	 */
	export class NetworkResponse
	{
		/** @internal */
		static fromXhr(xhr: XMLHttpRequest)
		{
			const res = new NetworkResponse();
			res.xhr = xhr;
			return res;
		}
		
		/** @internal */
		static fromError(errorString: ErrorString)
		{
			const res = new NetworkResponse();
			res._error = errorString;
			return res;
		}
		
		private constructor() { }
		private xhr: XMLHttpRequest | null = null;
		
		/**
		 * Stores the error string, if the NetworkRequest generated one.
		 * You should check to see if this property contains an empty string
		 * before proceeding to use the other members in this class.
		 */
		get error()
		{
			return this._error;
		}	
		private _error = ErrorString.noError;
		
		/**
		 * Returns the HTTP response header with the specified name.
		 */
		getHeader(headerName: string)
		{
			return this.xhr?.getResponseHeader(headerName) || "";
		}
		
		/**
		 * Gets whether the HTTP status code is in the 200 range.
		 */
		get ok()
		{
			return this.status >= 200 && this.status < 300;
		}
		
		/**
		 * Gets the HTTP status code of the response.
		 */
		get status()
		{
			return this.xhr?.status || 0;
		}
		
		/**
		 * Returns the response object as a Blob.
		 */
		blob()
		{
			return this.xhr ? 
				this.xhr.response as Blob :
				new Blob();
		}
		
		/**
		 * Converts the response object into an ArrayBuffer.
		 */
		arrayBuffer()
		{
			return this.blob().arrayBuffer();
		}
		
		/**
		 * Returns the raw text HTTP response. Depending on the S3 endpoint,
		 * this may either return an empty string, a string containing XML content,
		 * or the contents of the requested object.
		 */
		text()
		{
			return this.blob().text();
			//return new TextDecoder().decode();
		}
		
		/**
		 * Returns the HTTP response text as a JSON object. 
		 * 
		 * If the S3 endpoint used by the network request is one that returns an 
		 * XML response body, this method will convert the XML response into a 
		 * JSON object, and return this object.
		 * 
		 * If the S3 endpoint is a GetObject request, this method will attempt to
		 * parse this object data as JSON, and return the parsed object.
		 * 
		 * Returns null in the case when the response cannot be converted into
		 * a JSON object.
		 */
		async json(): Promise<object | null>
		{
			const text = await this.text();
			
			if (text.startsWith("<"))
				return S3XmlConverter.toJson(text);
			
			if (text === "")
				return null;
			
			try
			{
				return JSON.parse(text) as object;
			}
			catch (e) { }
			
			return null;
		}
	}
	
	/**
	 * Well-known strings which are generated by the NetworkResponse
	 * when connection-related errors occur.
	 */
	export declare const enum ErrorString
	{
		genericErrorResponse = "An unknown error occured.",
		
		/**
		 * A response that indicates that all attempts to create
		 * a connection failed. This may be because the machine is
		 * offline, or due to failure on the remote endpoint.
		 */
		noResponse = "Could not establish a connection to the server.",
		
		/**
		 * A response that indicates that all request retries failed,
		 * and the request operation timed out.
		 */
		timeoutResponse = "The network operation timed out.",
		
		/**
		 * A response that indicates that the user's machine is known to
		 * be offline. This can only be detected in some cases.
		 */
		offlineResponse = "Your network connection is disconnected.",
		
		/**
		 * A response that indicates that the remote endpoint returned
		 * data that the system is unable to handle.
		 */
		unexpectedResponse = "The server returned unexpected data.",
		
		/**
		 * A response that indicates that the user explicitly
		 * terminated the request.
		 */
		terminateResponse = "The request was terminated by the user.",
		
		/** */
		noError = ""
	}
}
