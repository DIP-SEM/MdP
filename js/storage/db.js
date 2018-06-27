/**
 * Maison Des Présences DB.js
 * 
 * Copyright 2014: SEM (https://edu.ge.ch/sem/)
 * 
 * Licensed under the GNU Public License (GPLv3)
 * http://opensource.org/licenses/GPL-3.0
 * 
 * Derivative of:
 * 
 * @file A module for interacting with the IndexedDB.
 * @author Matt West <matt.west@kojilabs.com>
 * @license MIT {@link http://opensource.org/licenses/MIT}.
 */

var nameDB = (function() {
	
  var tDB = {};
  var db = null;
  
   DB_NAME = 'mdp-indexedDB';
   DB_VERSION = 1; // Use a long long for this value (don't use a float)
   DB_STORE_NAME = 'mdp';



  /**
	 * Open a connection to the datastore.
	 * 	 	@param {function}
	 *              callback A function that will be executed once the
	 *              function has been completed.
	 */
  tDB.open = function(callback) {
	
	  	console.log("openDb ...");
	  	
	  	var req = indexedDB.open(DB_NAME, DB_VERSION);	  		
	  	
	    req.onsuccess = function (evt) {
	      // Better use "this" than "req" to get the result to avoid problems
	      // with
	      // garbage collection.
	      // db = req.result;
	      db = this.result;
	      console.log("openDb DONE");
	      callback();
	    };
	    
	    req.onupgradeneeded = function (evt) {

	      console.log("openDb.onupgradeneeded");
	      db = evt.target.result;
	      evt.target.transaction.onerror = tDB.onerror;
	      
	      
	      if (db.objectStoreNames.contains(DB_NAME)) {
	    	  db.deleteObjectStore(DB_NAME);
	      }

	      var store = db.createObjectStore(
	        DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });

	        store.createIndex('timestamp', 'timestamp', { unique: true });        
	    };

	    req.onerror = function (evt) {
	    	// Handle errors when opening the datastore.
	    	//alert("Activer l’option « conserver l’historique » dans les préférences du navigateur (Outils > Option > onglet « Vie privée »)");
			alert("erreur: " + req.error.message + ". Contactez un administrateur.");
	        console.error("onpenDb.onerror");
            console.error(req.error.message);
	    	req.onerror = tDB.onerror;
	    };
   }
  
  /**
	 * Clear name database / objectstore
	 * 
	 * @param {function}
	 *            callback A function that will be executed once the
	 *            function has been completed.
	 */
  
 tDB.clearObjectStore = function(callback) {
   
   if (!db) {
	   tDB.open( function() { 
		   console.log("Needed to open DB first"); 
	   });
	   if (!db) { 
		   alert("Activer l’option « conserver l’historique » dans les préférences du navigateur (Outils > Option > onglet « Vie privée »)"); 
	   };
   }	 

   var transaction = db.transaction(DB_STORE_NAME, 'readwrite');
   var store = transaction.objectStore(DB_STORE_NAME);
   var req = store.clear();
   
   transaction.oncomplete = function(evt) 
   {
       console.log("ObjectStore cleared");
       callback(evt);
   };
/*   
   req.onsuccess = function(evt) {
     console.log("ObjectStore cleared");
     callback(evt);
   };
   

   req.onerror = function (evt) {
     console.error("clearObjectStore:", evt.target.errorCode);
     callback(evt);
   };
*/
   
 }
	

  /**
	 * Fetch all of the name items in the datastore.
	 * 
	 * @param {function}
	 *            callback A function that will be executed once the items have
	 *            been retrieved. Will be passed a param with an array of the
	 *            name items.
	 */
 
  tDB.fetchNames = function(callback) {

	console.log("DB.fetchNames called");

	var transaction = db.transaction(DB_STORE_NAME, 'readwrite');
    var store = transaction.objectStore(DB_STORE_NAME); 
    var keyRange = IDBKeyRange.lowerBound(0);
    var cursorRequest = store.openCursor(keyRange);
    
    var name = null;
    var names = [];

    transaction.oncomplete = function(e) {
    	// shuffle the students array if checkBox is checked, and if user is in studentView
        if(simpleStorage.get('shuffle') && simpleStorage.get('studentView')){
            var j, x, i;
            for (i = names.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));
                x = names[i];
                names[i] = names[j];
                names[j] = x;
            }
        }
        // Execute the callback function.
      callback(names);
    };

    cursorRequest.onsuccess = function(e) {
      var result = e.target.result;
      
      console.log("DB.fetchNames cursor request onsuccess");

      if (!!result == false) {
        return;
      }
      
      names.push(result.value);
      if (result.hasOwnProperty('blob') && typeof value.blob != 'undefined') {
      	console.log("DB.fetchNames: result has blob property");
      }
      
      result.continue();
    };
    //console.log("DB.fetchNames on error");
    cursorRequest.onerror = tDB.onerror;
  };

  /**
	 * Create a new Name item.
	 * 
	 * @param {string}
	 * 			Title of the Name item.
	 * @param {blob}
	 * 			Image binary object
	 * @param {function}
	 * 			Callback function to call if named created
	 * 			successfully.
	 */

  tDB.createName = function(id, title, blob, callback) {
	  
	console.log("DB.createName called title="+title);

	if (!db) {
	   tDB.open( function() { 
		   console.log("Needed to open DB first"); 
	   });
	   if (!db) { 
		   alert("Activer l’option « conserver l’historique » dans les préférences du navigateur (Outils > Option > onglet « Vie privée »)"); 
	   };
    }	 

	var transaction = db.transaction(DB_STORE_NAME, 'readwrite');
    var store = transaction.objectStore(DB_STORE_NAME);


    // Create a timestamp for the name item.
    var timestamp = new Date().getTime();

    // Create an object for the name item.
    var name = {
    	'id': title,
      'title': title,
      'blob' : blob,
      'timestamp': timestamp
    };


    // Create the datastore request.
    var request = store.put(name);

    // Handle a successful datastore put.
    request.onsuccess = function(e) {
      // Execute the callback function.
      console.log("DB.createName on success");
      callback(name);
      return;
    };

    // Handle errors.
    // console.log("DB.createName On error");
    request.onerror = tDB.onerror;
  };
  
  tDB.updateName = function(title, timestamp, callback) {
	  
		console.log("DB.updateName called title="+title);
		console.log("DB.updateName called timestamp="+parseInt(timestamp));
		
		if (!db) {
		   tDB.open( function() { 
			   console.log("Needed to open DB first"); 
		   });
		   if (!db) { 
			   alert("Activer l’option « conserver l’historique » dans les préférences du navigateur (Outils > Option > onglet « Vie privée »)"); 
		   };
		}	 

		var transaction = db.transaction(DB_STORE_NAME, 'readwrite');
	    var store = transaction.objectStore(DB_STORE_NAME); 

	    var request = store.index('timestamp');
	    request.get(parseInt(timestamp)).onsuccess = function(e) {
	    	
	      console.log("DB.updateName.get on Success");	
	      // grab the data object returned as the result
	      var data =  e.target.result;
	      //console.log("Data returned:"+data.title);
	      
	      // update the notified value in the object to "yes"
	      if (data) {
	    	  
	    	  console.log("Data returned ="+data.title);
	    	  data.title = title;
		      // Create the datastore request.
		      var req = store.put(data);
	
		      // Handle a successful datastore put.
		      req.onsuccess = function(e) {
		    	  // Execute the callback function.
		    	  console.log("DB.updateName.put on success ="+data.title);	
		    	  callback(data);
		      };
		      return;
	      };

	      // Handle errors.
	      //console.log("DB.updateName On error");
	      request.onerror = tDB.onerror;

	    };
    };


  /**
	 * Delete a Name item.
	 * 
	 * @param {int}
	 *            key The timestamp (key) of the name item to be deleted.
	 * @param {function}
	 *            callback A callback function that will be executed if the
	 *            delete is successful.
	 */
  
  tDB.deleteName = function(key, callback) {


	console.log("DB.deleteName called with key="+key);

	if (!db) {
	   tDB.open( function() { 
		   console.log("Needed to open DB first"); 
	   });
	   if (!db) { 
		   alert("Activer l’option « conserver l’historique » dans les préférences du navigateur (Outils > Option > onglet « Vie privée »)"); 
	   };
	}	 

	var transaction = db.transaction(DB_STORE_NAME, 'readwrite');
    var store = transaction.objectStore(DB_STORE_NAME); 
	
    var request = store.index('timestamp');
    request.get(parseInt(key)).onsuccess = function(e) {
		
	    var data = e.target.result;

	    console.log("DB.delete.get success, data :"+data);

	    if (!data) {
	     console.log("No matching record found");
	     return;
	    };
		
	    var req = store.delete(data.id);
	    
	    req.onsuccess = function(e) {
	      console.log("DB.delete.delete success, key :"+data.id);
	      callback();
	    }
	    
	    req.onerror = function(e) {
	      console.log("DB.delete.delete error");
	      console.log(e);
	    };
	    
    };
    request.get(parseInt(key)).onfail = function(e) {
    	console.log("Store.index method failed");
    };
  };

  // Export the tDB object.
  return tDB;
  
}());