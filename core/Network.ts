
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
			return new Promise<NetworkResponse | BaseResponse>(resolve =>
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
								return resolve(new TimeoutResponse());
							
							retryCount--;
							attempt();
						},
						error: () =>
						{
							resolve(new NoResponse());
						},
						terminate: () => resolve(new TerminateResponse()),
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
			//xhr.responseType = "arraybuffer";
			xhr.responseType = "text";
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
				callbacks.complete(new NetworkResponse(xhr));
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
	 * @internal
	 */
	export class NetworkResponse
	{
		constructor(private xhr: XMLHttpRequest) { }
		
		/** */
		getHeader(headerName: string)
		{
			return this.xhr.getResponseHeader(headerName) || "";
		}
		
		/** */
		get ok()
		{
			return this.status >= 200 && this.status < 300;
		}
		
		/** */
		get status()
		{
			return this.xhr.status;
		}
		
		/** */
		get arrayBuffer()
		{
			const res = this.xhr.response;
			if (!(res instanceof ArrayBuffer))
				return new Uint8Array();
			
			return res;
		}
		
		/** */
		get text()
		{
			return new TextDecoder().decode(this.arrayBuffer);
		}
	}
	
	/** */
	export abstract class BaseResponse
	{
		constructor(readonly message: string) { }
	}
	
	/**
	 * A response that indicates that all attempts to create
	 * a connection failed. This may be because the machine is
	 * offline, or due to failure on the remote endpoint.
	 */
	export class NoResponse extends BaseResponse
	{
		constructor() { super(Strings.noResponse); }
	}
	
	/**
	 * A response that indicates that all request retries failed,
	 * and the request operation timed out.
	 */
	export class TimeoutResponse extends BaseResponse
	{
		constructor() { super(Strings.timeoutResponse); }
	}
	
	/**
	 * A response that indicates that the user explicitly
	 * terminated the request.
	 */
	export class TerminateResponse extends BaseResponse
	{
		constructor() { super(""); }
	}
	
	/**
	 * A response that indicates that the user's machine is known to
	 * be offline. This can only be detected in some cases.
	 */
	export class OfflineResponse extends BaseResponse
	{
		constructor() { super(Strings.offlineResponse); }
	}
	
	/**
	 * A response that indicates that the remote endpoint returned
	 * data that the system is unable to handle.
	 */
	export class UnexpectedResponse extends BaseResponse
	{
		constructor() { super(Strings.unexpectedResponse); }
	}
	
	/** */
	declare const enum Strings
	{
		genericError = "An unknown error occured.",
		timeoutResponse = "The network operation timed out.",
		noResponse = "Could not establish a connection to the server.",
		offlineResponse = "Your network connection is disconnected.",
		unexpectedResponse = "The server returned unexpected data.",
	}
}
