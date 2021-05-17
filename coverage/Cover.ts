
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
		const bucket = "put-test-bucket-" + Math.random();
		
		const putResult = await client.put({
			bucket,
			body: {
				CreateBucketConfiguration: {
					LocationConstraint: "us-east-1"
				}
			}
		});
	}
	
	/** */
	export async function coverPutObject()
	{
		const client = Cover.createClient();
		const key = "put-test-key-" + Math.random();
		
		const putResult = await client.put({
			key,
		});
	}
}
