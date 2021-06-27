
namespace AirS3
{
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
		
		constructor() { }
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
			return this.xhr?.response ? 
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
			const blob = this.blob();
			
			if (typeof blob.text === "function")
				return blob.text();
			
			return new Promise<string>(resolve =>
			{
				const reader = new FileReader();
				
				reader.onloadend = () =>
				{
					const result = reader.result as string || "";
					resolve(result);
				};
				
				reader.readAsText(blob);
			});
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
		async json(): Promise<Record<string, any> | null>
		{
			const text = await this.text();
			
			if (text.startsWith("<"))
				return S3XmlConverter.toJson(text);
			
			if (text === "")
				return null;
			
			try
			{
				return JSON.parse(text);
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
