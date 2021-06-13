
namespace AirS3
{
	/** */
	export type Protocol = "http" | "https";
	
	/** */
	export type Query = Record<string, string | number>;
	
	/** */
	export interface IBaseOptions
	{
		/**
		 * @internal
		 * The HTTP method to use in the request. This property
		 * can be omitted, as it will be automatically populated by
		 * the library.
		 */
		method?: string;
		
		/**
		 * The bucket related to the request, if applicable.
		 */
		bucket?: string;
		
		/**
		 * Stores the key of the object, without a leading / character
		 */
		key?: string;
		
		/**
		 * Stores the query string to use in the request, without the leading ? mark,
		 * and without and leading endpoint name.
		 */
		query?: Query;
		
		/**
		 * Sets the region to use. If omitted, the region is assumed to be
		 * us-east-1.
		 */
		region?: string;
		
		/**
		 * Any additional HTTP headers to include in the request. Note that these
		 * headers do not need to include the headers that are required in order to
		 * authorize the request, such as Authorization and X-Amz-Content-Sha256.
		 */
		headers?: IHttpHeaders & object;
	}
	
	/** */
	export interface IRequestOptions extends IBaseOptions
	{
		/**
		 * The name of the endpoint, which is written in the query string.
		 * This value should be omitted for S3 endpoints that do not use
		 * a named endpoint, such as CreateBucket and ListObjects.
		 */
		endpoint?: string;
		
		/**
		 * An optional request body to pass with the request.
		 * If this value is a plain JavaScript object, it will be converted
		 * into an XML representation before being transmitted.
		 */
		body?: BodyInit | S3XmlJsonObject;
		
		/**
		 * The number of times to retry the request, in the case when network access
		 * is determined to be unavailable. Defaults to 0.
		 */
		retryCount?: number;
		
		/**
		 * A reference to a Stopper object, which can be used to terminate
		 * the request before it completes.
		 */
		stopper?: Stopper;
		
		/** */
		readonly callbacks?: {
			readonly cancel?: () => void;
			readonly progress?: (loaded: number, total: number) => void;
			readonly complete?: () => void;
		};
	}
	
	/** */
	export interface IPresignOptions extends IBaseOptions
	{
		expiresIn?: number;
	}
	
	/** */
	export declare const enum HttpMethod
	{
		get = "GET",
		post = "POST",
		put = "PUT"
	}
}
