
namespace Cover
{
	/** */
	export async function coverCreateBucket()
	{
		const client = Cover.createClient();
		const bucket = "bucket-" + Date.now();
		const putResponse = await client.put({ bucket });
		
		return () => putResponse.status === 200;
	}
	
	/** */
	export async function coverCreateBucketAtRegion()
	{
		const client = Cover.createClient();
		const bucket = "bucket-" + Date.now();
		
		const putResponse = await client.put({
			bucket,
			region: "us-east-2",
			body: {
				CreateBucketConfiguration: {
					LocationConstraint: "us-east-2"
				}
			}
		});
		
		if (putResponse.status !== 200)
			return () => !"Response status is not 200.";
		
		const getResponse = await client.get({
			bucket,
			endpoint: "location"
		});
		
		if (getResponse.error)
			return () => !"GetBucketLocation returned an error.";
		
		const responseJson = await getResponse.json();
		if (responseJson === null)
			return () => !"Response JSON is null.";
		
		return () => responseJson.LocationConstraint === "us-east-2";
	}
	
	/** */
	export async function coverDeleteBucket()
	{
		const client = Cover.createClient();
		const bucket = "bucket-" + Date.now();
		const putResult = await client.put({ bucket });
		const deleteResult = await client.delete({ bucket });
		
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
