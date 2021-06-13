
namespace AirS3
{
	/**
	 * A class that represents a controller object that facilitates termination
	 * of one or more AirS3 requests.
	 */
	export class Stopper
	{
		/**
		 * Terminates any active S3 HTTP requests to which this Stopper
		 * object has been associated.
		 */
		stop()
		{
			for (const xhr of this.xhrs)
				xhr.abort();
			
			this.xhrs.clear();
			this._hasStopped = true;
		}
		
		/**
		 * @internal
		 * Do not call from outside the library.
		 */
		connect(xhr: XMLHttpRequest)
		{
			const remove = () => this.xhrs.delete(xhr);
			xhr.addEventListener("error", remove);
			xhr.addEventListener("loadend", remove);
			xhr.addEventListener("timeout", remove);
			this.xhrs.add(xhr);
		}
		private readonly xhrs = new Set<XMLHttpRequest>();
		
		/**
		 * @internal
		 */
		get hasStopped() { return this._hasStopped; }
		private _hasStopped = false;
	}
}
