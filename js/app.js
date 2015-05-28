/* Maison Des Présences app.js
 * 
 * Copyright 2014: DSI-SEM (https://www.ge.ch/sem/)
 * 
 * Licensed under the GNU Public License (GPLv3)
 * http://opensource.org/licenses/GPL-3.0
 * 
 * Derivative of:
 *  
 * JavaScript Load Image Demo JS 1.9.1
 * https://github.com/blueimp/JavaScript-Load-Image
 *
 * Copyright 2013, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 * 
 */

/* global window, document, loadImage, HTMLCanvasElement, $ */


$(function () {
	
    'use strict';
    
    // Sound files (.ogg) are defined in index.html with IDs OK = Success, KO = Fail
    
    var result = $('#row'),
        sndOK = $('#OK'),
        sndKO = $('#KO'),
        name = null, 
        names = [],
        
        options = {
    	// These are JavaScript-Load-Image library option settings
    	// please refer to: https://github.com/blueimp/JavaScript-Load-Image#options
    	// for complete list of options.
     		minWidth: 200,
     		minHeight: 250,
     		maxWidth: 200,
     		maxHeight: 250,
     		contain: true,
     		canvas: true,
     		crop: true
    	},

        
        makeUnselectable = function( target ) {
    	
    		// Prevent user from doing funny things with the images (select / drag over).
    	
    	target
    		.addClass( 'unselectable' ) // All these attributes are inheritable
    		.attr( 'unselectable', 'on' ) // For IE9 - This property is not inherited, needs to be placed onto everything
    		.attr( 'draggable', 'false' ) // For moz and webkit, although Firefox 16 ignores this when -moz-user-select: none; is set, it's like these properties are mutually exclusive, seems to be a bug.
    		.on( 'dragstart', function (e) {e.preventDefault();}); //function() { return false; } );  // Needed since Firefox 16 seems to ingore the 'draggable' attribute we just applied above when '-moz-user-select: none' is applied to the CSS 

    	target // Apply non-inheritable properties to the child elements
    		.find( '*' )
    		.attr( 'draggable', 'false' )
    		.attr( 'unselectable', 'on' ); 
        },
        
        loadConfig = function() {
        	
        	// Load configuration settings from the SimpleStorage API
        	// Prepare configuration pop-up window contents accordingly 

        	if (simpleStorage.get('caseSense')) {
        		$('#case-sense').prop('checked', true);
        	} else {
        		$('#case-sense').removeAttr('checked');
        	}
        	if (simpleStorage.get('accentSense')) {
        		$('#accent-sense').prop('checked', true);
        	} else {
        		$('#accent-sense').removeAttr('checked');
        	}
        	if (simpleStorage.get('studentView')) {
        		$('#eleve').prop('checked', true);
        	} else {
        		$('#eleve').removeAttr('checked');
        	}
        	if (simpleStorage.get('teacherView')) {
        		$('#prof').prop('checked', true);
        	} else {
        		$('#prof').removeAttr('checked');
        	}
        	
        	$('#class-name').val(simpleStorage.get('className'));

        },
        
        saveConfig = function() {
        	
        	// Save configuration settings from individual pop-up window
        	// store values to SimpleStorage API
        	
        	console.log("Saving options...");
        	var caseSense = $('#case-sense')[0].checked;
        	var accentSense = $('#accent-sense')[0].checked;
        	var studentView = $('#eleve')[0].checked;
        	var teacherView = $('#prof')[0].checked;
        	var className = $('#class-name').val();
        	console.log("Case-sense:"+caseSense);
        	simpleStorage.set('caseSense', caseSense, {TTL: 0});
        	simpleStorage.set('accentSense',accentSense, {TTL: 0});
        	simpleStorage.set('studentView',studentView, {TTL: 0});
        	simpleStorage.set('teacherView',teacherView, {TTL: 0});
        	simpleStorage.set('className', className, {TTL: 0});

        },
        
        displayImage = function (file, options) {
        	
        	// Handler for Displaying Images that are uploaded or Drag & Dropped to browser window
        	// Similar function to refreshNames that communicates with the IndexedDB instead. 
    	
            if (!loadImage(
                    file,
                    function (img) {
                        var content, more, hidden, dataID;
                        if (!(img.src || img instanceof HTMLCanvasElement)) {
                        	content = $('<span>Loading image file failed</span>');
                        	result.children().replaceWith(content);
                        } else {
                        	content = $('<a target="_blank">').append(img)
                                .attr('download', file.name)
                                .attr('href', img.src || img.toDataURL())
                                .attr('tabindex', "-1");
                        	makeUnselectable(content);
                        	$('#Tlabel').replaceWith(content);
                        	hidden = $('#Ilabel');
                        	dataID = hidden.attr('data-id') || "";
                        	console.log("DisplayImage: filename="+file.name);
                        	console.log("DisplayImage: dataID="+dataID);
                        	more = $('<input></input>').append()
                        		.attr('type', 'hidden')
                        		.attr('name', 'img-name')
                        		.attr('data-id', dataID)
                        		.attr('value', file.name);

                        	nameDB.createName(file.name,
	           					img.src || img.toDataURL(), 
                        		function(name) {
                        			console.log("Name created in DB: title="+name.title);
                        			console.log("Name created in DB: key="+name.timestamp);
                        			more.append().attr('key', name.timestamp);                        			
                        		});                        		
                        	hidden.replaceWith(more);
                        	console.log("Populate name with Data-id="+dataID);
                        	var selector1 = "[name='name-input'][data-id='"+dataID+"']";
                        	var fnameValue = file.name;

                        	// Strip image file postfix e.g. ".gif"
                        	if (fnameValue.lastIndexOf(".") > 0) {
                        		fnameValue = fnameValue.substring(fnameValue.lastIndexOf("/")+1, fnameValue.lastIndexOf("."));
                        	}
                        	$(selector1).val(fnameValue);
                        }                    	
                    }, options
                )) {
                result.children().replaceWith(
                    $('<span>Your browser does not support the URL or FileReader API.</span>')
                );
            }
        },
                
        dropChangeHandler = function (e) {
        	
        	// Drag & Drop as well as File Upload -activity handler
        	// Display images immediately and store them in IndexedDB
        	
        	e.stopPropagation();
        	e.preventDefault();
            e = e.originalEvent;
            var target = e.dataTransfer || e.target,
                files = target && target.files;
            
            if (!($('#eleve')[0].checked)) {  //not StudentView
            	// Piggy-bag for later use
            	simpleStorage.set('count', files.length, {TTL: 0});
            	for(var b = 0; b < files.length; b++) {
            		var file = files[(files.length - 1 - b)];
            		displayImage(file, options);
            	};
            }
    	    $('#file-input').val(null);
        },
        
        playSoundHandler = function (id) {
        	
        	// OK-button handler to verify user entered text against correct value
        	// First-time correct value is deduced from image-filename omitting postfix (format eg .gif)
        	// Second-time correct value is fetched from the IndexedDB
        	// Text-field values are prepared to take into account Latin accents, upper and lower case letters

        	console.log("Data-id="+id);
        	var selector1 = "[name='name-input'][data-id='"+id+"']";
        	var selector2 = "[name='img-name'][data-id='"+id+"']";
        	var nameValue = $(selector1).val() || "";
        	var fnameValue = $(selector2).val() || "";
        	// Strip image file postfix e.g. ".gif"
        	if (fnameValue.lastIndexOf(".") > 0) {
        		fnameValue = fnameValue.substring(fnameValue.lastIndexOf("/")+1, fnameValue.lastIndexOf("."));
        	}
        	/*
        	"Piqué".latinise();
        	"Pique"
        	
        	"Piqué".isLatin();
        	false
        	*/
            var caseSense = $('#case-sense')[0].checked;
        	var accentSense = $('#accent-sense')[0].checked;
        	
        	if (!caseSense) {
        		nameValue = nameValue.toLowerCase();
        		fnameValue = fnameValue.toLowerCase();
        		console.log("toLowerCase");
        	}
        	
        	if (!accentSense) {
        		nameValue = nameValue.latinise();
        		fnameValue = fnameValue.latinise();
        		console.log("toLatin");
        	}	

        	console.log("if ("+nameValue+")");
        	console.log("equals ("+fnameValue+")");

        	if (nameValue == fnameValue) {
        		$(selector1).css('backgroundColor', 'lightGreen');
        		sndOK.get(0).play();
        	} else {
        		$(selector1).css('backgroundColor', 'red');
        		sndKO.get(0).play();
        	}

        },
                
        deleteThumbnailHandler = function (id) {
        	
        	// Remove-button handler, delete thumbnail image and metadata from IndexedDB

        	console.log("deleteThumbnails");
        	console.log("Data-id="+id);
        	var selector2 = "[name='img-name'][data-id='"+id+"']";
        	var key = $(selector2).attr('key') || "";
        	console.log("To-be-deleted Key="+key);
        	
        	var retVal = confirm("Voulez-vous supprimer image miniature ?");
        	if( retVal == true ){
        		// First 
        		nameDB.deleteName( key, function () {
            		console.log("Try: Thumbnail ("+key+") deleted");
            	});
        		// Second is the charm 
            	nameDB.deleteName( key, function () {
            		console.log("Retry: Thumbnail ("+key+") deleted");
            	});

            	location.reload();
        	   
        	}
     
        },
        
        updateThumbnailHandler = function (id) {
        	
        	// Update-button handler, store newly entered text-field value to IndexedDB

        	console.log("updateThumbnails");
        	console.log("Data-id="+id);
        	var selector1 = "[name='name-input'][data-id='"+id+"']";
        	var selector2 = "[name='img-name'][data-id='"+id+"']";
        	var key = $(selector2).attr('key') || "";
        	var nameValue = $(selector1).val() || "";
        	var fnameValue = $(selector2).val() || "";
        	console.log("updating with key="+key);
        	console.log("updating ("+nameValue+") over ("+fnameValue+")");
        	nameDB.updateName(nameValue, key, function (name) {
        		console.log("updateName complete ="+name.title);
        		$(selector2).val(name.title);  //fnameValue = nameValue;
        		$(selector1).val(name.title);
        	});
        	location.reload();
        },
        
        updateThumbnailsHandler = function () {
        	
        	// Update the whole list of thumbnails at once
    		var x = parseInt(simpleStorage.get('count'));
    		console.log("Tlabel count="+x);

        	for (var id = 1; id < x; id++) {
    			console.log("update text fields");
    			console.log("Data-id="+id);
    			var selector1 = "[name='name-input'][data-id='"+id+"']";
    			var selector2 = "[name='img-name'][data-id='"+id+"']";
    			var key = $(selector2).attr('key') || "";
    			var nameValue = $(selector1).val() || "";
    			var fnameValue = $(selector2).val() || "";
    			console.log("updating with key="+key);
    			console.log("updating ("+nameValue+") over ("+fnameValue+")");
    			nameDB.updateName(nameValue, key, function (name) {
    				console.log("updateName complete ="+name.title);
    				$(selector2).val(name.title);  //fnameValue = nameValue;
    				$(selector1).val(name.title);
    			});
    		}
        	simpleStorage.set('requires-save', false, {TTL: 0});
        	//location.reload();
        },
        
        radioViewHandler = function () {
        	
        	// Configuration pop-up window handler 

        	console.log("Hello, radioViewHandler here ...");
        	var studentView = $('#eleve')[0].checked;
        	var teacherView = $('#prof')[0].checked;
        	console.log("studentView =",studentView);
        	console.log("teacherView =",teacherView);
        	
        	$(".starter-template h1").html($('#class-name').val());
        	
        	if (studentView) {
        		
        		// Student View
        		// 1. If text fields have new new input, save after user confirmation
        		// 2. Clear text fields of default values while waiting for student input 
        		// 3. Collect above values for professor view later
        		// 4. Hide remaining empty image frames
        		// 5. Hide buttons (#trash, #record) and navigation bar

        		var x = parseInt(simpleStorage.get('count'));
        		console.log("Tlabel count="+x);

        		$(".starter-template h1").show();
    
        		if (simpleStorage.get('requires-save') == true) {
        			var retVal = confirm("Voulez-vous sauvegarder modifications avant proceder ?");
                	if (retVal == true) {
                		updateThumbnailsHandler();
                		//simpleStorage.set('requires-save', false, {TTL: 0});
                		location.reload();
                	}
        		}
        		
        		for (var b = 1; b <= 25; b++) {
        			console.log("Clear names: "+b);
        			var selector1 = "[id='name-input'][data-id='"+b+"']";
        			var cleared_name = $(selector1).val();
        			console.log("Cleared_name:"+cleared_name);
        			simpleStorage.set(b, cleared_name, {TTL: 0});
        			$(selector1).val('');
        		}
        		
        		for (var z = x+1; z <= 25; z++) {
        			console.log("name-form hide: "+z);
        			var selector1 = "[id='name-form'][data-id='"+z+"']";
        			$(selector1).hide();
        		}

        		$('#nav-bar').hide();
            	$('#verify*').show();
                $('#trash*').hide();
                $('#record*').hide();
                //Done in for loop above already
                //$('#name-input*').val('');

                // Experimental, you have been warned...
                //$('#name-form*').shuffle();
                // or
                //$('#name-form*').filter(":visible").shuffle();
                
        	} else {  

        		// Professor View
        		// 1. Show all text fields
        		// 2. Re-Populate emptied fields
        		// 3. Show navigation bar
        		// 4. Show activity buttons (#trash, #record)
        		// 5. Hide Class-name heading as well as "OK" (#verify) button
        		
        		$('#name-form*').show();
        		
        		for (var y = 1; y < 25; y++) {
        			console.log("Repopulate name fields: "+y);
        			var selector1 = "[id='name-input'][data-id='"+y+"']";
        			var selector2 = "[id='img-name'][data-id='"+y+"']";
        			var cleared_name = simpleStorage.get(y);
        			console.log("Cleared name:"+cleared_name);
        			if (cleared_name && cleared_name != "") {
        				$(selector1).val(cleared_name);
        				$(selector1).show();
        				simpleStorage.set(y, '', {TTL: 0});
        			}
        		}
        		
        		$(".starter-template h1").hide();
        		$('#nav-bar').show();
            	$('#verify*').hide();
                $('#trash*').show();
                $('#record*').hide();

        	}
        },
        
        urlQueryHandler = function ( query ) {
        	
        	// Query URL string manipulation
        	// collect everything after "?"
        	
            query = query.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
            var expr = "[\\?&]"+query+"=([^&#]*)";
            var regex = new RegExp( expr );
            var results = regex.exec( window.location.href );
            if ( results !== null ) {
            	window.history.replaceState("O", "T", window.location.pathname);
                return results[1];
            } else {
                return false;
            }
        },
        
        refreshNames = function () {
        	
        	// Fetch all image thumbnails and meta-data from IndexedDB
        	// Image is a Blob-object (Binary Large Object)
        	
        	name = null;
        	names = [];
        	console.log("RefreshNames");
        	
        	nameDB.fetchNames( function(names) {
        		
        		console.log("Names db.length="+names.length);
        		// Piggy-bag number of images in the indexedDB database for later use
            	simpleStorage.set('count', names.length, {TTL: 0});
            	
            	//Simple man's shuffle i.e. reverse order disabled
            	//for(var a = 0; a < names.length; a++) {
        	    for(var a = names.length; a > 0; a--) {
        	    	
            		//name = names[(names.length - 1 - a)];
            		name = names[(names.length - a)];
                	name.title = name.title || "";
                	name.timestamp = name.timestamp || null;
                	name.blob = name.blob || null;
                	console.log("Outside loadimage:( "+(names.length-a)+" ) "+name.title);
                	
                	if (loadImage(
                            name.blob,
                            function (img) {
                                var content;
                                if (!(img.src || img instanceof HTMLCanvasElement)) {
                                	content = $('<span>Loading image file failed</span>');
                                	result.children().replaceWith(content);
                                } else {
                                	content = $('<a target="_blank">').append(img)
                                        .attr('download', 'image.png')
                                        .attr('href', img.src || img.toDataURL())
                                        .attr('tabindex',"-1");
                                	makeUnselectable(content);
                                	$('#Tlabel').replaceWith(content);
                                }                    	
                            }, options
                        )) {
                		var more, hidden, dataID;
                		hidden = $('#Ilabel');
                    	dataID = hidden.attr('data-id') || "";

                    	console.log("RefreshNames: filename="+name.title);
                    	console.log("RefreshNames: dataID="+dataID);
                    	console.log("RefreshNames: key="+name.timestamp);
                    	more = $('<input></input>').append()
                    		.attr('type', 'hidden')
                    		.attr('name', 'img-name')
                    		.attr('data-id', dataID)
                    		.attr('value', name.title)
                    		.attr('key', name.timestamp);
                    	hidden.replaceWith(more);
                    	console.log("Populate name with Data-id="+dataID);
                    	var selector1 = "[name='name-input'][data-id='"+dataID+"']";
                    	var fnameValue = name.title;

                    	// Strip image file postfix e.g. ".gif"
                    	if (fnameValue.lastIndexOf(".") > 0) {
                    		fnameValue = fnameValue.substring(fnameValue.lastIndexOf("/")+1, fnameValue.lastIndexOf("."));
                    	}
                    	$(selector1).val(fnameValue);
                	
                	} else {
                	
                		console.log("Loadimage from blob failed");
                        result.children().replaceWith(
                            $('<span>Your browser does not support the URL or FileReader API.</span>')
                        );
                	};
                };  
            	radioViewHandler();
        	});
    }; 
        
    // Hide URL/FileReader API requirement message in capable browsers:
    if (window.createObjectURL || window.URL || window.webkitURL || window.FileReader) {
        result.children().hide();
    };
    
    $(window).bind('beforeunload', function() {
    	// Forbid user from leaving current page if unsaved new content entered
    	console.log("Before unload here");
    	if (simpleStorage.get('requires-save') == true) {
    		alert("Sauvegarde necessaire!");
    		updateThumbnailsHandler();
    		//simpleStorage.set('requires-save', false, {TTL: 0});
    		location.reload();
    	}
    });
    
    $(window).on('load', function (e) {
    	
    	// User activity preparations once the MDP page is loaded 
    	e.stopPropagation();
        e.preventDefault();

        //Circumvent the FF autofill functionality	
        $("input").each(function(){
            // match checkbox and radiobox checked state with the attribute
            if((this.getAttribute('checked')==null) == this.checked)
                this.checked = !this.checked;
            // reset value for anything else
            else this.value = this.getAttribute('value')||'';
        });

        // Select the option that is set by the HTML attribute (selected)
        $("select").each(function(){
            var opts = $("option",this), selected = 0;
            for(var i=0; i<opts.length; i++) 
                if(opts[i].getAttribute('selected')!==null) 
                    selected = i;

            this.selectedIndex = selected||0;
        }); 

        // Fetch images and metadata from the IndexedDB
        // Load app configuration settings from the SimpleStorage
        nameDB.open(refreshNames);
        makeUnselectable($('#Tlabel*'));
        loadConfig();

        // Example usage - /?mode=P (Professor) or /?mode=E (Eleve) 
        // Determine Professor or Student mode in the URL
        // Prepare User view accordingly
        var url_param = urlQueryHandler('mode');
        
        if( url_param ) {
        	console.log("Url_param true");
        	if (url_param == 'e' || url_param == 'E') {
        		$('#eleve').prop('checked', true);
        		$('#prof').removeAttr('checked');
        		saveConfig();
        		radioViewHandler();
        	}
        	if (url_param == 'p' || url_param == 'P') {
        		$('#eleve').removeAttr('checked');
        		$('#prof').prop('checked', true);
        		saveConfig();
        		radioViewHandler();
        	}
        }
        
    });
    
    // Drag & Drop handler of images on the browser window
    $(document)
        .on('dragover', function (e) {
        	e.stopPropagation();
            e.preventDefault();
            e = e.originalEvent;
            e.dataTransfer.dropEffect = 'copy';
        })
        .on('drop', dropChangeHandler);
    
    // File upload button does the same thing as previous 
    $('#file-input').on('change', dropChangeHandler);
    
    // Reset database pop-up window texts
    $("#reset").easyconfirm( { locale: {
    	title: 'Etes-vous sûr?',
    	text: 'Etes-vous sûr que vous souhaitez supprimer base de données?',
    	button: ['Annuler',' Confirmer'],
    	closeText: 'fermer'
    }});
    
    // Reset database action handler after user confirmation
    $("#reset").on('click', function(e) {
      	e.stopPropagation();
    	e.preventDefault();
      	nameDB.clearObjectStore( function() {
			console.log("Object store reset");
      	});
      	alert("Base de données est supprimée.");
      	location.reload();
    });
     
    // OK -button handler, play sounds afterwards
    $('#verify*').on('click', function (e) {
         e.stopPropagation();
         e.preventDefault();
         var id = parseInt(e.target.getAttribute('data-id'));
         playSoundHandler(id);
    });
    
    // Remove-button handler, delete thumbnail image
    $('#trash*').on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        var id = parseInt(e.target.getAttribute('data-id'));
        deleteThumbnailHandler(id);
    });
    
    // Record-button handler, update entered text field values to IndexedDB
    $('#record*').on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        var id = parseInt(e.target.getAttribute('data-id'));
        updateThumbnailHandler(id);
    });
   
    // Prof/Student-view selector handler, save new configuration after
    $("#prof, #eleve").on('change', function (e) {
    	e.stopPropagation();
    	e.preventDefault();
    	console.log("Prof/Eleve radio on change");
        radioViewHandler();
        saveConfig();
        //location.reload();
    });
    
    // Text input -field handler when new text entered
    $('#name-input*').on('input',function(e) {
    	e.stopPropagation();
        e.preventDefault();
        var value = $(this).val();
        var id = parseInt(e.target.getAttribute('data-id'));
        console.log("input detected on data-id:"+id+"="+value);
        var selector2 = "[name='img-name'][data-id='"+id+"']";
		var key = $(selector2).attr('key') || "";
        console.log("key:"+key);
    	var teacherView = $('#prof')[0].checked;
    	console.log("teacherView =",teacherView);
        if (teacherView)
        {
        	nameDB.updateName(value, key, function (name) {
        		console.log("IndexedDB updated: "+name.title);
        		$.growl(false, {
        			allow_dismiss: false,
        			delay: 2000,
        			timer: 1000
        		});
        		$.growl({ 
        			message: 'Prénom sauvegardé!'},{
        			type: 'success'
        		});
        	});
        	//Auto-save implemented
        	//simpleStorage.set('requires-save', true, {TTL: 0});
        }
    });	
    
    // Configuration - pop-up window handler
    $('#config').on('hidden.bs.modal', function (e) {
    	console.log("hidden.bs.modal event on #config");
    	saveConfig();
    	location.reload();
    });
    
    $('#name-input*').on('keyup',function(e) {
    	e.stopPropagation();
        e.preventDefault();
        
    	if (e.keyCode == 13) 
    	{  //Enter pressed
    		console.log("This is Enter-key handler");
    		var id = parseInt(e.target.getAttribute('data-id'));
    		var studentView = $('#eleve')[0].checked;
        	var teacherView = $('#prof')[0].checked;
        	console.log("studentView =",studentView);
        	console.log("teacherView =",teacherView);
        
        	if (studentView)
        		{
        			// StudentView
        			playSoundHandler(id);	
        		} 
        		else 
        		{
        			// ProfessorView
        			updateThumbnailHandler(id);
        		}
    	}
    });	
        
});	