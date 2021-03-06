function divElementEnostavniTekst(sporocilo) {
  var splitText = sporocilo.split("http");
  var splitTextNovo = splitText;
  var sporociloNovo = sporocilo;
  if(splitText.length > 1){
    for(var i = 0; i < splitText.length; i++){
      splitText[i] = "http" + splitText[i];
      var jeSmesko = splitText[i].indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
      if (jeSmesko) {
        splitTextNovo[i] = splitText[i].replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
        sporociloNovo = sporociloNovo.replace(splitText[i], splitTextNovo[i]);
        //return $('<div style="font-weight: bold"></div>').html(sporocilo);
      }
      else if(splitText[i].indexOf('https://www.youtube.com/watch?v=') > -1){
        splitTextNovo[i] = splitText[i].replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;iframe', '<iframe');
        sporociloNovo = sporociloNovo.replace(splitText[i], splitTextNovo[i]);
      }
      else{
        var slika = splitText[i].indexOf('.jpg') + splitText[i].indexOf('.png') + splitText[i].indexOf('.gif');
        if(splitText[i].indexOf('http') > -1 && slika > -2){
          splitTextNovo[i] = splitText[i].replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />').replace('jpg\' /&gt;', 'jpg\' />').replace('gif\' /&gt;', 'gif\' />');
          sporociloNovo = sporociloNovo.replace(splitText[i], splitTextNovo[i]);
        }
      }
    }
    return $('<div style="font-weight: bold;"></div>').html(sporociloNovo);
  }
  else return $('<div style="font-weight: bold;"></div>').text(sporociloNovo);
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  sporocilo = dodajSliko(sporocilo);
  sporocilo = dodajVideo(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('dregljaj', function (sporocilo) {
    $('#vsebina').jrumble({x:5, y:0, rotation:0});
    $('#vsebina').trigger('startRumble');
    setTimeout(function() {$('#vsebina').trigger('stopRumble');}, 1500);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }
    
    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
    
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function() {
      $('#poslji-sporocilo').val("/zasebno \"" + $(this).text() + "\" ");
      $('#poslji-sporocilo').focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
      var zamenjava = "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />";
      vhodnoBesedilo = vhodnoBesedilo.split(smesko).join(zamenjava);
  }
  return vhodnoBesedilo;
}

function dodajSliko(vhodnoBesedilo){
  var text = vhodnoBesedilo;
  var splitText = text.split("http");
  for(var i = 0; i < splitText.length; i++){
    splitText[i] = "http" + splitText[i];
    var start = splitText[i].indexOf("http");
    var end = -1;
    var smesko = splitText[i].indexOf("sandbox.lavbic.net");
    if(splitText[i].indexOf(".jpg") != -1){
      end = splitText[i].indexOf(".jpg");
    }
    else if(splitText[i].indexOf(".png") != -1){
      end = splitText[i].indexOf(".png");
    }
    else{
      end = splitText[i].indexOf(".gif");
    }
    if(start != -1 && end != -1 && smesko == -1){
      var url = splitText[i].substring(start, end+4);
      vhodnoBesedilo = vhodnoBesedilo + 
        " <img id=\"slika\" src='" + url + "' />";
    }
  }
  return vhodnoBesedilo;
}

function dodajVideo(vhodnoBesedilo){
  var text = vhodnoBesedilo;
  var splitText = text.split("https://www.youtube.com/watch?v=");
  console.log(splitText);
  for(var i = 1; i < splitText.length; i++){
    splitText[i] = " <iframe id=\"youtube\" src=\"https://www.youtube.com/embed/" + splitText[i] + "\" allowfullscreen></iframe>";
    vhodnoBesedilo += splitText[i];
  }
  return vhodnoBesedilo;
}
