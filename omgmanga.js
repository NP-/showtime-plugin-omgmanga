/**
 * OMG Manga plugin for showtime version 0.23  by NP
 *
 *  Copyright (C) 2011 NP
 * 
 *  ChangeLog:
 *  0.23
 *  minor fixs
 *  0.22
 *  Minor fix in chapter indexing
 *  0.21
 *  Minor fix
 * 	Change plugin logo thanks to Girish Patel
 *  0.2
 *  Added Bookmarks
 * 	Added Search Support   (search can be a bit slow, so give it a minute)
 * 	Fix small problem with links
 * 
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


(function(plugin) {


 var PREFIX = 'omgmanga:';	
 var YAHOO_PIPES = 'http://pipes.yahoo.com/pipes/pipe.run?_id=';
//settings 

  var service =
    plugin.createService("OMG Manga", PREFIX + "start", "tv", true,
			   plugin.path + "omgmanga.png");
  
  var settings = plugin.createSettings("OMG Manga",
					  plugin.path + "omgmanga.png",
					 "Manga Reader");

  settings.createInfo("info",
			     plugin.path + "omgmanga.png",
			     "Manga Reader \n"+
			     "Copyrighted Limited www.OMGmanga.com - Some Rights Reserved.\n"+
				 "Plugin developed by NP \n");

//store
	var bookmarks = plugin.createStore('bookmarks', true);

	if(!bookmarks.manga)
		bookmarks.manga = '';



function startPage(page) {      	

   page.type = "directory";
   page.metadata.title = "OMG Manga: " + "Latest Chapters";
   page.metadata.logo = plugin.path + "omgmanga.png";


   var site = showtime.httpGet("http://www.omgmanga.com/").toString();
   var popular = site;
   site = site.slice(site.indexOf("Latest Chapters"), site.indexOf('<div class="contentbox_down">'));
   var split = site.split('<div class="contentbox_item_series">');
   
   for each (var manga in split){
	   if(manga.match('<a href=".*" title') != null){
		   var url = manga.match('<a href=".*" title').toString();
		   manga = manga.replace(url,'');
		   url = url.replace('<a href="http://','').replace('" title','');
			page.appendItem( PREFIX +"present:" + url + ":" + 'fetch', "directory", { title: manga.match('title=".*">').toString().replace('title="','').replace('">','') });
		}	   
	   }

   page.appendItem( PREFIX + "more", "directory", {
			title: "More"
			});

   if(bookmarks.manga.length >= 10)
	    	page.appendItem( PREFIX + "bookmarks", "directory", { title: "Bookmarks" });


			
   page.loading = false;  
  }


plugin.addURI( PREFIX + "more", function(page) { 
  page.type = "directory";
  page.metadata.title = "OMG Manga: " + "More";
  page.metadata.logo = plugin.path + "omgmanga.png";
  
  var list = ["#","A","B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", 
			  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
  
  for each (var letter in list) {
		page.appendItem( PREFIX +'more:'+ letter, "directory", { title:  letter});
		}
  
  page.loading = false;
     
});


plugin.addURI( PREFIX + "more:(.*)", function(page, letter) {
   
  page.type = "directory";
  page.metadata.title = "OMG Manga: " + "Mangas starting with " + letter.replace(/\//g, ' ').toUpperCase();
  page.metadata.logo = plugin.path + "omgmanga.png";
   
  if(letter != "#" && letter.length == 1)
	letter = letter.toLowerCase();
	
  var site = showtime.httpGet("http://www.omgmanga.com/directory/" + letter).toString();
  
  site = site.slice(site.indexOf('Series Name'),site.indexOf('<div class="fotter">'));
  
  var split = site.split('</a> on');
   
   for each (var manga in split){
	   if(manga.match('<a href=".*" title') != null){
		   var url = manga.match('<a href=".*" title').toString().replace('" title','');
		   manga = manga.replace(url,'');
		   url = url.replace('<a href="http://','');
		   
		   page.appendItem( PREFIX + "present:" + url + ":" + 'fetch', "directory", {
			title: manga.match('title=".*">').toString().replace('title="','').replace('">','')
			});
		}	   
	   }
	   
  var url_next = site.slice(site.lastIndexOf('href="',site.lastIndexOf("Next"))+6, site.lastIndexOf('">Next',site.lastIndexOf("Next"))).replace("http://www.omgmanga.com/directory/",'');
  
  if(url_next.length >2 && url_next.length <6)	
	page.appendItem( PREFIX + "more:" + url_next, "directory", {
			title: "Next"
			});   
  page.loading = false; 
});



plugin.addURI( PREFIX + "present:(.*):(.*)", function(page, link, url) {

	if(url == 'fetch' || !url ){
		url = findLastChapter(link);
		var read = "Read Last Chapter";
	}else{
		var read = "Read Selected Chapter";
	}
		
   page.metadata.logo = plugin.path + "omgmanga.png";
   
   var content = showtime.httpGet("http://"+link).toString();
   content = content.slice(content.indexOf('<div class="main">'), content.indexOf('<div class="contentbox_up">Chapters</div>'));
   
   var title = content.slice(content.indexOf('<h2>')+4,content.indexOf('</h2>',content.indexOf('</h2>')));
   page.metadata.title = title;
   
   content.match('<h2>.*</h2>').toString().replace('<h2>','').replace('</h2>','');  
   page.metadata.icon = content.slice(content.indexOf('<img src="')+10,content.indexOf('" alt',content.indexOf('<img src="')));
   
   page.appendPassiveItem("label", content.slice(content.indexOf('<a href="">')+11,content.indexOf('</a><br><br>',content.indexOf('<a href="">'))).replace(/<a href="">/g,"").replace(/<\/a>/g,""));	
   page.appendPassiveItem("rating", parseFloat(content.slice(content.indexOf('<b>Rating:</b> ')+15,content.indexOf('/5',content.indexOf('<b>Rating:</b> ')))/5));
   
   page.appendPassiveItem("label", content.slice(content.indexOf('<b>Author: </b>')+15,content.indexOf('<br>',content.indexOf('<b>Author: </b>'))), { title: "Author"});
   page.appendPassiveItem("label", content.slice(content.indexOf('<b>Status</b>')+14,content.indexOf('<br>',content.indexOf('<b>Status</b>'))), { title: "Status"});
   
   
   var descrip = content.slice(content.indexOf('<p>Summary</p>'),content.indexOf('</spam>',content.indexOf('<p>Summary</p>'))).replace('<spam>','');
   page.appendPassiveItem("bodytext", new showtime.RichText(descrip));

  
   if(url != 'No chapters yet'){
	   content = showtime.httpGet("http://"+url).toString();
	   url = "http://www.omgmanga.com"+ content.slice(content.indexOf('<img id="mangaimage" class="manga" src="http://www.omgmanga.com/')+63, content.indexOf('" alt=',content.indexOf('<img id="mangaimage" class="manga" src="')+40)-8); 
		page.appendAction("navopen", url, true, { title: read });
		page.appendAction("navopen", PREFIX + "episodes:"+link, true, { title: "All Chapters" });
	}else{ showtime.message(title + ': no chapters yet' , true, false); }
	
   //bookmarks		
	if(!bookmarked(link)){
		var bookmakrButton = page.appendAction("pageevent", "bookmark", true,{ title: "Bookmark" });
	}
	else{		
		var bookmakrButton = page.appendAction("pageevent", "bookmark_remove", true,{ title: "Remove Bookmark" });
	}
   
   page.loading = false;
   page.type = "item";
   
  	page.onEvent('bookmark', function(){ 
		if(!bookmarked(link)){
			bookmark(link, title)
			showtime.message('Bookmarked: '+ title, true, false);
		}else
			showtime.message('Already Bookmarked: '+ title, true, false);
		});

	page.onEvent('bookmark_remove', function(){ 
		if(!bookmarked(link)){
			showtime.message(title +' Not bookmarked ', true, false);
		}else{
			showtime.message(title + ' bookmark removed' , true, false);
			bookmark_remove(link, title);
		}
		});   


});

plugin.addURI( PREFIX + "episodes:(.*)", function(page, link) {
	
   page.type = "directory";
   page.metadata.logo = plugin.path + "omgmanga.png";
   var content = showtime.httpGet("http://"+link).toString();     
   page.metadata.title = "OMG Manga: " + content.slice(content.indexOf('<h2>')+4,content.indexOf('</h2>',content.indexOf('</h2>')));
   content = content.slice(content.indexOf('<div class="contentbox_mid">'), content.indexOf('<div class="contentbox_down"></div>'));
   
   var split = content.split('<div class="contentbox_item_catlist">');
	var aux=0;
   for each (var manga in split){
	   if(manga.match('<a href=".*" title') != null){
		   var url = manga.slice(manga.indexOf('<a href="http://')+16, manga.indexOf('" title')); 
			page.appendItem( PREFIX + 'present:'+link+':'+url , "directory", {
				title: manga.slice(manga.indexOf('title="')+7, manga.indexOf('">',manga.indexOf('title="')))
				});  
		}	   
	   }

   page.loading = false;
});


//bookmarks

plugin.addURI( PREFIX + "bookmarks", function(page) {
	page.type = "directory";
    page.contents = "video";
    page.metadata.logo = plugin.path + "omgmanga.png";
   	page.metadata.title = 'Bookmarks';

	
	if(bookmarks.manga){	
		var split = bookmarks.manga.split('\n');
		for each (var manga in split){
			if(manga.indexOf('\t') != -1)
				page.appendItem( PREFIX + 'present:'+ manga.slice(0, manga.indexOf('\t'))+':fetch' , "video", { title:  manga.slice(manga.indexOf('\t')+1) });
			}
		}
		
	page.loading = false;	
});



plugin.addSearcher(
    "OMG Manga", plugin.path + "omgmanga.png",
    function(page, query) {
	
    showtime.trace('OMG Manga - Started Search for: ' +escape(query));

	query = escape(query);
	
	var list = { indice: [ 
		{name: "1-10"  , link: "1-2-3-4-5-6-7-8-9-10"},
		{name: "11-20" , link: "11-12-13-14-15-16-17-18-19-20"},
		{name: "21-30" , link: "21-22-23-24-25-26-27-28-29-30"},
		{name: "31-40" , link: "31-32-33-34-35-36-37-38-39-40"},
		{name: "41-50" , link: "41-42-43-44-45-46-47-48-49-50"},
		{name: "51-60" , link: "51-52-53-54-55-56-57-58-59-60"},
		{name: "61-70" , link: "61-62-63-64-65-66-67-68-69-70"},
		{name: "71-80" , link: "71-72-73-74-75-76-77-78-79-80"}
			]
		}
	
	var aux = 0;
	for each (var range in list.indice) {
	
		var search_content = showtime.httpGet( YAHOO_PIPES + '0032e6197c074e8337cdb52c8ba91e93&_render=JSON&search='+ query +'&range=' + range.link).toString();
		search_content = eval( '(' + search_content + ')');
		
		for each (var manga in search_content.value.items) {
			page.appendItem( PREFIX + 'present:www.omgmanga.com/manga/' + manga.link + ':fetch',"directory", { title: manga.title });
			aux++;
		}
	
	}
	showtime.trace('OMG Manga - Ended Search for: ' +escape(query) + ' '+aux + ' results');
	page.type = "directory";
    page.entries = aux;
    page.loading = false;           
});



//FUNCTIONS

function getUrl(link) {
   var content = showtime.httpGet("http://"+link).toString();
   content = content.slice(content.indexOf('<img id="mangaimage" class="manga" src="')+40, content.indexOf('" alt=',content.indexOf('<img id="mangaimage" class="manga" src="')+40)-8);
   return content;	
}

function bookmark(link, title){
	
	if(bookmarked(link))
		return;
		
	bookmarks.manga = bookmarks.manga + link + "\t" + title + "\n";
}

function bookmark_remove(link, title){
	
	if(!bookmarked(link, title))
		return;
	
	bookmarks.manga = bookmarks.manga.replace(link +"\t"+title+"\n", '');
}
function bookmarked(link, title){
	
	if(bookmarks.manga && bookmarks.manga.indexOf(link) !=-1){
		return true;
	}else{ return false; }

}


function findLastChapter(link){
	var content = showtime.httpGet("http://"+link).toString();
	content = content.slice(content.indexOf('<a href="http://',content.indexOf('<div class="contentbox_item_catlist">'))+16,
		content.indexOf('" title="',content.indexOf('<div class="contentbox_item_catlist">')));
	if(content == '')
		return 'No chapters yet';
	return content;
}

	
plugin.addURI( PREFIX + "start", startPage);
})(this);
