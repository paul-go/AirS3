
namespace AirS3
{
	/**
	 * Describes a generic object which will be converted into XML, which
	 * will be used for the XML in an HTTP request body.
	 */
	export type S3XmlJsonObject = Record<string, string | number | object>;
	
	/** */
	export interface IS3ListObjectsOptions
	{
		readonly prefix: string;
		readonly startAfter?: string;
		readonly maxKeys?: number;
	}
	
	/** */
	export interface IS3PutObjectResponse
	{
		readonly versionId: string;
	}
	
	/** */
	export interface IS3MultipartUploadResponse
	{
		readonly bucket: string;
		readonly key: string;
		readonly uploadId: string;
	}
	
	/** */
	export interface IS3PartUploadResponse
	{
		readonly eTag: string;
	}
	
	/** */
	export interface IS3CompleteUploadResponse
	{
		
	}
	
	/** */
	export interface IS3Object
	{
		/**
		 * The name that you assign to an object. You use the object key to retrieve the object.
		 */
		key?: string;
		
		/**
		 * The date the Object was Last Modified
		 */
		lastModified?: string;
		
		/**
		 * The entity tag is a hash of the object. The ETag reflects changes only to the
		 * contents of an object, not its metadata. The ETag may or may not be an MD5
		 * digest of the object data. Whether or not it is depends on how the object was
		 * created and how it is encrypted as described below:   Objects created by the
		 * PUT Object, POST Object, or Copy operation, or through the AWS Management
		 * Console, and are encrypted by SSE-S3 or plaintext, have ETags that are an MD5
		 * digest of their object data.   Objects created by the PUT Object, POST Object,
		 * or Copy operation, or through the AWS Management Console, and are encrypted
		 * by SSE-C or SSE-KMS, have ETags that are not an MD5 digest of their object data.
		 * If an object is created by either the Multipart Upload or Part Copy operation, 
		 * the ETag is not an MD5 digest, regardless of the method of encryption.  
		 */
		eTag?: string;
		
		/**
		 * Size in bytes of the object.
		 */
		size?: number;
  	}
	
	/** */
	export interface IS3ListBucketResponse
	{
		/**
		 * Set to false if all of the results were returned. Set to true if more keys are available 
		 * to return. If the number of results exceeds that specified by MaxKeys, all of the results 
		 * might not be returned.
		 */
		isTruncated?: boolean;
		
		/**
		 * Metadata about each object returned.
		 */
		contents?: IS3Object[];
		
		/**
		 * The bucket name. When using this API with an access point, you must direct 
		 * requests to the access point hostname. The access point hostname takes the form
		 *  AccessPointName-AccountId.s3-accesspoint.Region.amazonaws.com. When 
		 * using this operation with an access point through the AWS SDKs, you provide 
		 * the access point ARN in place of the bucket name. For more information about 
		 * access point ARNs, see Using Access Points in the Amazon Simple Storage Service 
		 * Developer Guide. When using this API with Amazon S3 on Outposts, you must 
		 * direct requests to the S3 on Outposts hostname. The S3 on Outposts hostname 
		 * takes the form 
		 * 
		 * AccessPointName-AccountId.outpostID.s3-outposts.Region.amazonaws.com. 
		 * 
		 * When using this operation using S3 on Outposts through the AWS SDKs, you 
		 * provide the Outposts bucket ARN in place of the bucket name. For more
		 * information about S3 on Outposts ARNs, see Using S3 on Outposts in the 
		 * Amazon Simple Storage Service Developer Guide.
		 */
		name?: string;
		
		/**
		 * Keys that begin with the indicated prefix.
		 */
		prefix?: string;
		
		/**
		 * Causes keys that contain the same string between the prefix and the first
		 * occurrence of the delimiter to be rolled up into a single result element in
		 * the CommonPrefixes collection. These rolled-up keys are not returned
		 * elsewhere in the response. Each rolled-up result counts as only one return
		 * against the MaxKeys value.
		 */
		delimiter?: string;
		
		/**
		 * Sets the maximum number of keys returned in the response. By default the
		 * API returns up to 1,000 key names. The response might contain fewer keys
		 * but will never contain more.
		 */
		maxKeys?: number;
		
		/**
		 * All of the keys rolled up into a common prefix count as a single return when
		 * calculating the number of returns. A response can contain CommonPrefixes
		 * only if you specify a delimiter.  CommonPrefixes contains all (if there are any)
		 * keys between Prefix and the next occurrence of the string specified by a delimiter. 
		 * CommonPrefixes lists keys that act like subdirectories in the directory specified
		 * by Prefix. For example, if the prefix is notes/ and the delimiter is a slash (/) as in 
		 * notes/summer/july, the common prefix is notes/summer/. All of the keys that roll
		 * up into a common prefix count as a single return when calculating the number of returns. 
		 */
		commonPrefixes?: unknown;
		
		/**
		 * Encoding type used by Amazon S3 to encode object key names in the 
		 * XML response. If you specify the encoding-type request parameter, 
		 * Amazon S3 includes this element in the response, and returns encoded 
		 * key name values in the following response elements:  Delimiter, Prefix, 
		 * Key, and StartAfter.
		 */
		encodingType?: string;
		
		/**
		 * KeyCount is the number of keys returned with this request. KeyCount 
		 * will always be less than equals to MaxKeys field. Say you ask for 50 keys, 
		 * your result will include less than equals 50 keys 
		 */
		keyCount?: number;
	}
}
