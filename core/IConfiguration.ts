
namespace AirS3
{
	/**
	 * Defines the configuration options necessary to instantiate an
	 * AirS3 client.
	 */
	export interface IConfiguration
	{
		readonly accessKey: string;
		readonly secretKey: string;
		readonly host?: string;
		readonly port?: number;
		readonly protocol?: Protocol;
		readonly usePathStyle?: boolean;
	}
	
	/**
	 * An enumeration of the hosts used by the most common S3-compatible
	 * storage vendors.
	 */
	export const enum Host
	{
		airbox = "airboxup.com",
		amazon = "s3.amazonaws.com",
		filebase = "s3.filebase.com",
		wasabi = "s3.wasabisys.com",
	}
}
