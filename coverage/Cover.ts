
namespace Cover
{
	/** */
	export async function coverAirS3()
	{
		const client = Cover.createClient();
		debugger;
	}
	
	/** */
	export async function coverCreateBucket()
	{
		const client = Cover.createClient();
		const bucket = "bucket-" + Date.now();
		const putResult = await client.put({ bucket });
		
		debugger;
	}
	
	/** */
	export async function coverCreateBucketAtRegion()
	{
		const client = Cover.createClient();
		const bucket = "bucket-" + Date.now();
		
		const putResult = await client.put({
			bucket,
			body: {
				CreateBucketConfiguration: {
					LocationConstraint: "us-east-1"
				}
			}
		});
		
		debugger;
	}
	
	/** */
	export async function coverPutObject()
	{
		const client = Cover.createClient();
		const key = "put-test-key-" + Date.now();
		
		const putResult = await client.put({
			key,
		});
	}
}
