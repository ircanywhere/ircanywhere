/*
 * $.serializeObject()
 *
 * Basically the same as $.serializeArray(), however, returns an object
 */
$.fn.serializeObject = function()
{
	var o = {};
	$.each(this.serializeArray(), function()
	{
		if (o[this.name] !== undefined)
		{
			if (!o[this.name].push)
				o[this.name] = [o[this.name]];
			o[this.name].push(this.value || '');
		}
		else
		{
			o[this.name] = this.value || '';
		}
	});
	return o;
};