/* Maison Des Présences app.js
 * 
 * Copyright 2014: SEM (https://edu.ge.ch/sem/)
 * 
 * Licensed under the GNU Public License (GPLv3)
 * http://opensource.org/licenses/GPL-3.0
 * 
 * Derivative of:
 *  
 * JavaScript Load Image Demo JS 2.19.0
 * https://github.com/blueimp/JavaScript-Load-Image
 *
 * Copyright 2013, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 *
 *
 *
 * 
 */



/* Everything starts here */


/* Set the numbers of hours before the automatic reinitialisation of presence starts*/
NB_HOURS_REINITIALISATION = 10;

$(function () {
        
    // Hide URL/FileReader API requirement message in capable browsers:
    if (window.createObjectURL || window.URL || window.webkitURL || window.FileReader) {
        result.children().hide();
    };

    initialize();

});

if (document.readyState === "complete"){
	console.log("loading.....");
	$('.loader').css('display', 'none');
}

