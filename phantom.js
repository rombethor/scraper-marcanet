var webpage = require('webpage');
var page;

system = require('system');
var t = Date.now();

if (system.args.length === 1) {
  console.log('Usage: phantom.js <expedient start number> <expedient end number>');
  phantom.exit();
}

t = Date.now();
var testindex = 0;
var loadInProgress = false;



var seguir = true;
var stepn = -1;






var marca = {
	expediente: "0000000",
	registro: "00000000",  /*5*/
	vigencia: "00/00/00",  /*13*/
	denominacion: "17",
	tipo: "23",
	clase: "0",
	nombre: "ABC S.A. DE C.V.", /*37*/
	correo: "55",
	telefono: "51",
	renovacion: 0,
	presentacion: "0",
	hecho: false };


var expid = system.args[1];
var exlim = system.args[2];




var steps =[
	function() {
		page = webpage.create();
		//page.settings.loadImages = false;

		page.onConsoleMessage = function(msg){ console.log(msg); };

		page.onAlert = function(msg) { console.log(msg); };

		page.onLoadStarted = function() { loadInProgress = true; console.log("load started"); };

		page.onLoadFinished = function(status) {
			loadInProgress = false;
			if( status != 'success' )
			{
				console.log('Unable to access network.');
				testindex--;
				seguir = true;
			}
			else
			{
				console.log("Load finished");
				seguir = true;
			}
		};

		page.onUrlChanged = function(targetUrl) {
		  console.log('New URL: ' + targetUrl);
		  //seguir = true;
		};


		t = Date.now();
		console.log("Opening page...");
		seguir = false;
		testindex++;
		page.open("http://marcanet.impi.gob.mx/marcanet/vistas/common/datos/bsqExpedienteCompleto.pgi", function(status) {
		  if (status !== 'success') {
		    console.log('FAIL to load the address');
		  } else {
		    console.log('Loading ' + expid);
		    console.log('Loading time ' + (Date.now() - t) + ' msec');
		  }
		});
	},

	function() {
		seguir = false;
		testindex++;

		/*page.includeJs("https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js", function() {*/
			if( page.injectJs("jquery-3.2.1.min.js") )
			{
				//var wait = true;
				//var res = true;
				if( ! page.evaluate(function(n) {
				  $("input[type=text]").val(n);
				  /*$("form[name=frmBsqExp]").submit();*/
				  if( $(".ui-messages-error-summary").length )
				  {	return "err"; }
				  PrimeFaces.ab({s:"frmBsqExp:busquedaId2",u:"frmBsqExp:pnlBsqExp frmBsqExp:dlgListaExpedientes"});return false;

			    }, expid) )
			    {
					seguir = true;
				}
				else
				{
					testindex = 4;
					seguir = true;
				}
			}
	},
	function() {
		seguir = false;
		testindex++;
		console.log("Response: ");
		if( page.injectJs("jquery-3.2.1.min.js") )
		{
			marca =
			page.evaluate( function()
			{
				/*Get the response*/
				var lastd = $("td > span");

				var brand = {
					expediente: "0",
					registro: "0",  /*5*/
					vigencia: "0",  /*13*/
					denominacion: "0",
					tipo: "0",
					clase: "0",
					nombre: "0", /*37*/
					correo: "0",
					emailagent: "0",
					telefono: "0",
					renovacion: 0,
					presentacion: "0",
					hecho: false };

				if( ! lastd.length )
				{ brand.hecho = true; }


				var renewal = $("td.tabla-franjas-encabezado");
				renewal.each( function(index) {
					if( $(this).text().match(/\d{4}/) != null && Number($(this).text()) >= 2015 )
					{
						if( $(this).next("td").text().indexOf("RENOVACI") != -1 )
						{
							brand.renovacion = 1;
							console.log("IN RENOVATION");
						}
					}
				} );

				var clases = $("#dtGrdProductos\\:0\\:dtTblProdServ\\:0\\:txtClase");
				clases.each( function(index) {
					if( ! isNaN($(this).text()) )
					{
						brand.clase += $(this).text();
					}
				});

				var is = "nothing";
				var cuenta = lastd.length;
				var val;
				lastd.each(function(index) {

					//console.log("## "+$( this ).text() + "::" + $( this ).parent().next("td").text());

						if( $(this).text().indexOf("de vigencia") != -1 && brand.vigencia == "0" )
						{	brand.vigencia = $(this).parent().next("td").text(); }
						else if( $(this).text().indexOf("mero de expediente") != -1 && brand.expediente == "0" )
						{	brand.expediente = $(this).parent().next("td").text(); }
						else if( $(this).text().indexOf("de registro") != -1 && brand.registro == "0")
						{	 brand.registro = $( this ).parent().next("td").text(); }
						else if( $(this).text().indexOf("Denominaci") != -1 && brand.denominacion == "0")
						{	brand.denominacion = $(this).parent().next("td").text(); }
						else if( $(this).text().indexOf("Tipo de marca") != -1 && brand.tipo == "0")
						{	brand.tipo = $(this).parent().next("td").text(); }
						else if( $(this).text().indexOf("Nombre") != -1 && brand.nombre == "0" )
						{	brand.nombre = $(this).parent().next("td").text(); }
						else if( $(this).text().indexOf("E-mail") != -1 && brand.correo == "0" )
						{	brand.correo = $(this).parent().next("td").text();	}
						else if( $(this).text().indexOf("Tel") != -1 && brand.telefono == "0" )
						{	brand.telefono = $(this).parent().next("td").text(); }
						else if( $(this).text().indexOf("Fecha de presentaci") != -1 && brand.presentacion == "0" )
						{	brand.presentacion = $(this).parent().next("td").text(); }
						else if( $(this).text().indexOf("E-mail") != -1 && brand.correo != "0" && brand.emailagent == "0" )
						{
							brand.emailagent = $(this).parent().next("td").text();
							if( brand.emailagent.indexOf(brand.correo) != -1 )
														{
															brand.correo = "?";
							}
						}

					if (!--cuenta){ brand.hecho = true; } /* continue the program */

				} ) ; /* end of each */


				return brand;

			});/* end of page.evaluate */

			while( seguir == false )
			{
				if( marca.hecho == true )
				{
					seguir = true;
					console.log("marca.hecho is true");
				}
			}
			//page.render('test.png');
		}/* end of includeJS */
	},
	function(){
		testindex++;
		console.log( "Checking validity...\n" );
		if( marca.registro.match(/\d+/) == null )
		{
			console.log("No numero de registro: " + marca.registro + "  Marca rechazado.");
		}
		else
		{
			console.log("\nRegistro: " + marca.registro + "\nVigencia: " + marca.vigencia);
			console.log("\nDenominacion: " + marca.denominacion + "\nTipo: " + marca.tipo );
			console.log("\nNombre: " + marca.nombre + "\nCorreo: " + marca.correo + "\nTelefono: " + marca.telefono + "\n");
			console.log("Clase: " + marca.clase + "\n");


			if( marca.vigencia.match(/\d{2}\/\d{2}\/\d{4}/) != null )
			{

				var vd = new Date();
				vd.setDate(marca.vigencia.substring(0,2) );
				vd.setMonth(marca.vigencia.substring(3,5)-1);
				vd.setYear(marca.vigencia.substring(6,10) );

				var ahora = new Date();

				var diff = Math.round( (ahora.getTime() - vd.getTime()) / (1000*60*60*24) );

			/*
				if( diff < 180 && diff > 0 )
				{
					//renovacion
				}
				else if( diff > -180 && diff <= 0 )
				{
					console.log("Aviso de caducidad.");
				}
			*/
				var dateform = marca.vigencia.substring(6,10)+"-"+marca.vigencia.substring(3,5)+"-"+marca.vigencia.substring(0,2);

				var presdate = marca.presentacion.substring(6,10)+"-"+marca.presentacion.substring(3,5)+"-"+marca.presentacion.substring(0,2);

				var postdata = "nExpediente="+marca.expediente+"&nRegistro="+marca.registro+"&dVigencia="+dateform+"&wName="+marca.nombre+"&wDenominacion="+marca.denominacion+"&nTipo="+marca.tipo+"&nClase="+marca.clase+"&nTelefono="+marca.telefono+"&wCorreo="+marca.correo+"&bRenovacion="+marca.renovacion+"&nDias="+diff+"&dPresentacion="+presdate;

				page.open("http://www.iltas.com.mx/inteligencia/addToImpi.php", 'post', postdata, function(status){
					if(status !== 'success')
					{	console.log('Unable to post!'); }
					else
					{	console.log(page.content); }
				});



				/* Store in database with telephone and email */
			}
		}
		seguir = true;
		/*
		console.log("\n\nEstimado " + marca.nombre + "\n\nHemos detectado que su marca " + marca.tipo + " '" + marca.denominacion + "' vencio el dia " + marca.vigencia + ".");
		console.log("Email?" + marca.correo + " ...o telefono: " + marca.telefono); */
	},

	function() {
		page.close();
		page = 0;
		console.log("Result time: " + (Date.now() - t) );
		console.log("Next number please...");
		if( expid <= exlim )
		{	testindex = 0;  expid++; }
		seguir = true;
	}
];

/*
while( expid <= exlim )
{
	if( seguir == true )
	{
		seguir = false;
		stepn++;
		steps[stepn]();
	}
	if( expid == exlim )
	{
		phantom.exit();
	}
}*/


var interval = setInterval( function() {
	if( !loadInProgress && typeof steps[testindex] == "function" )
	{
		if( seguir == true )
		{
			console.log("step "+testindex);
			steps[testindex]();
		}
	}

	if( typeof steps[testindex] != "function" )
	{
		console.log("test complete");
		phantom.exit();
	}
}, 1500);
