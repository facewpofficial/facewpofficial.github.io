function getUrlParameters()
{
	var result = new Object();
	var pageUrl = decodeURIComponent(window.location.search.substring(1));
	// fix an old bug in client
	pageUrl = pageUrl.replace("?","&");
	var urlParams = pageUrl.split('&');
	for (var i = 0; i < urlParams.length; i++)
	{
		var parts = urlParams[i].split('=');
		if (parts.length >= 2)
		{
			result[parts[0]] = parts[1];
		}
	}
	return result;
}

window.onload = function() {
	var urlParams = getUrlParameters();
	if (urlParams["purchase"])
	{
		var email = urlParams["email"];
		if (!email) {
			email = userEmail;
		}
		var firstName = urlParams["firstName"];
		var lastName = urlParams["lastName"];
		var quantity = urlParams["quantity"];
		var couponCode = urlParams["couponCode"];
		var source = urlParams["source"];
		openPopupStore(email, firstName, lastName, quantity, couponCode, source, null);
		
	}
}



function openPopupStore(email, firstName, lastName, quantity, couponCode, source, defaultSource)
{
	if (source && defaultSource)
	{
		source = source + "_" + defaultSource;
	}
	else if (!source)
	{
		source = defaultSource;
	}
	if (!source)
	{
		source="";
	}

	quantity = Number(quantity);
	if (quantity <= 0 || isNaN(quantity))
	{
		quantity = 1;
	}

	var f = fastspring.builder;
	f.push({"products":[{"path":"daisydisk","quantity":quantity}], "tags":{"source":source}});
	if (email || firstName || lastName)
	{
		f.recognize(email, firstName, lastName);
	}
	if (couponCode)
	{
		f.promo(couponCode);
	}
	f.checkout();

	consentedGA('send', 'event', 'Purchase Open', source);
}

function openPopupStoreFromSite(defaultSource)
{
	var urlParams = getUrlParameters();
	var source = urlParams["source"];
	openPopupStore(null, null, null, null, null, source, defaultSource);
}

function OnFSPopupWebhookReceived(data)
{
	var output = data.items[0].fulfillments.daisydisk_license_0[0].license;
	var outputLines = output.split("\n");
	for (var i=0; i<outputLines.length; ++i)
	{
		var line = outputLines[i];
		var equatesIndex = line.indexOf("=");
		if (equatesIndex > 0)
		{
			var varName = line.slice(0, equatesIndex);
			if (varName == "hash")
			{
				var value = line.slice(equatesIndex + 1, line.length);
				window.licenseKeyHash = value;
				break;
			}
		}
	}
}

function onFSPopupClosed(orderReference)
{
	if (orderReference)
	{
		consentedFBQ('track', "Purchase");
		// note: the page needs to be explicitly http or safari will block the register link
		var keyHash = window.licenseKeyHash;
		window.location.replace("https://facewp.com/thankyou.html?keyHash=" + (keyHash ? keyHash : ""));
	}
}

function onFSDataDecorate(url)
{
	try
	{
		consentedGA(function()
		{
			var trackers = ga.getAll();
			linkerParam = trackers[0].get('linkerParam');
		});

		url = url + '?' + linkerParam;
	}
	catch (e)
	{}

	return url;
}