/*
*       All functions here
*/

var result = $('#row'),
    sndOK = $('#OK'),
    sndKO = $('#KO'),
    name = null,
    names = [],

    options = {
        // These are JavaScript-Load-Image library option settings
        // please refer to: https://github.com/blueimp/JavaScript-Load-Image#options
        // for complete list of options.
        maxWidth: 310,
        maxHeight: 310,
        minWidth: 100,
        minHeight: 50,
        cover: true,
        canvas: true,
        crop: true
        //, orientation:true
    };

// add as many student nodes as user wants
 function populateMain(){
    // if students < 1, displays message
    var nbStudent = simpleStorage.get('nbStudent');
    if(isNaN(nbStudent)){
        nbStudent = 0;
    }
    if(nbStudent<1){
        displayExplanation();
    } else{
        for (var i=1; i<= simpleStorage.get('nbStudent'); i++){
            createNewStudent(i);
        }
    }
};

 function displayExplanation(){
    var divTuto = document.createElement('div');
    divTuto.className = "emptyContent";
    divTuto.id = "emptyContent";
    var explanation = document.createTextNode("Pour ajouter des élèves, utilisez la fonction parcourir, ou glissez-déposez les fichiers dans la fenêtre, depuis le mode d'administration.");
    divTuto.appendChild(explanation);
    document.getElementById('classe').appendChild(divTuto);
};


function deleteExplanation(){
    var nested = document.getElementById('emptyContent');
    document.getElementById('classe').removeChild(nested);
};

function playSoundHandler (id) {

    // OK-button handler to verify user entered text against correct value
    // First-time correct value is deduced from image-filename omitting postfix (format eg .gif)
    // Second-time correct value is fetched from the IndexedDB
    // Text-field values are prepared to take into account Latin accents, upper and lower case letters

    console.log("Data-id="+id);
    var selector1 = "[name='name-input'][data-id='"+id+"']";
    var selector2 = "[name='img-name'][data-id='"+id+"']";
    var nameValue = $.trim($(selector1).val());
    var fnameValue = $.trim($(selector2).val());

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

    if (nameValue === fnameValue) {
        $(selector1).css('backgroundColor', 'lightGreen');
        //son juste aléatoire
        var son = "snd/son"+ Math.floor((Math.random() * 3) + 1) +".mp3";
        $('#OK').attr('src',son);
        sndOK.get(0).play();
        // add student name to array in order to keep it saved even if user reload page
        var arr = simpleStorage.get("rightNames");
        if(arr === null){
            arr = [];
        }
        arr.push($.trim($(selector1).val()));
        simpleStorage.set("rightNames", arr);
        $(selector1).parent().parent().addClass('present');
    } else {
        $(selector1).css('backgroundColor', '#ff8080');
        sndKO.get(0).play();
    }

};


function lireLettres(key) {
    if (!key || key.length !== 1) return;

    var keyLower = key.toLowerCase();

    // D'abord essayer le son accentué
    var audioAccent = document.getElementById('snd-' + keyLower);
    if (audioAccent) {
        audioAccent.currentTime = 0;
        audioAccent.play();
        return;
    }

    // Sinon, jouer la lettre de base (A-Z)
    var lettre = key.toUpperCase().latinise();
    var code = lettre.charCodeAt(0);

    if (code >= 65 && code <= 90) {
        var audio = document.getElementById(code);
        if (audio) {
            audio.currentTime = 0;
            audio.play();
        }
    }
};

function deleteThumbnailHandler(id) {

    // Remove-button handler, delete thumbnail image and metadata from IndexedDB

    console.log("deleteThumbnails");
    console.log("Data-id="+id);
    var selector2 = "[name='img-name'][data-id='"+id+"']";
    var key = $(selector2).attr('key') || "";
    console.log("To-be-deleted Key="+key);

    var retVal = confirm("Voulez-vous supprimer image miniature ?");
    if(retVal){
        // delete the div
        var element = document.querySelector('[data-id="'+id+'"]');
        document.getElementById('classe').removeChild(element);
        var nbStudent = parseInt(simpleStorage.get("nbStudent"))-1;
        simpleStorage.set("nbStudent", nbStudent);
        $('#nb-student').val(simpleStorage.get('nbStudent'));
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
};

 function dropChangeHandler(e) {

    // Drag & Drop as well as File Upload -activity handler
    // Display images immediately and store them in IndexedDB

    e.stopPropagation();
    e.preventDefault();
    e = e.originalEvent;
    var target = e.dataTransfer || e.target,
        files = target && target.files;

    if (simpleStorage.get('teacherView')) {  //not StudentView
        // Piggy-bag for later use
        simpleStorage.set('count', files.length, {TTL: 0});
        console.log('nbFiles: ' + files.length);
        for(var b = 0; b < files.length; b++) {
            var file = files[b];
            var nbStudent = parseInt(simpleStorage.get('nbStudent'))+1;
            if(isNaN(nbStudent)){
                nbStudent = 1;
            }
            createNewStudent(nbStudent);
            simpleStorage.set('nbStudent', nbStudent);
            $('#nb-student').val(simpleStorage.get('nbStudent'));
            displayImage(file, options);
        };
        if(simpleStorage.get('nbStudent')>0){
            deleteExplanation();
        }
        $('#file-input').val(null);
    }
};


function updateThumbnailHandler(id) {

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
        $(selector2).val(name.title);
        $(selector1).val(name.title);
    });
};


function updateThumbnailsHandler() {

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
};

function checkIfAlreadyWritten(name){
    var arr = simpleStorage.get("rightNames");
    if(arr !== null){
        for(var i=0; i<arr.length; i++){
            console.log("nom deja ecrits: " + arr[i]);
            if(arr[i].toUpperCase() === name.toUpperCase()){
                return true;
            }
        }
    }
    return false;
};

function radioViewHandler() {

        // Configuration pop-up window handler

        console.log("Hello, radioViewHandler here ...");
        var studentView = simpleStorage.get('studentView');
        var teacherView = simpleStorage.get('teacherView');
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

            if (simpleStorage.get('requires-save')) {
                var retVal = confirm("Voulez-vous sauvegarder modifications avant proceder ?");
                if (retVal) {
                    updateThumbnailsHandler();
                }
            }

            // hide student names
            // except right ones which had already been written.
            for (var b = 1; b <= simpleStorage.get("nbStudent"); b++) {
                console.log("Clear names: "+b);
                var selector1 = "[id='name-input'][data-id='"+b+"']";
                var selector2 = "[name='img-name'][data-id='"+b+"']";
                if(simpleStorage.get("afficherNoms")){ // Afficher noms des élèves si l'option est cochée
                    $(selector2).attr('type', 'visible');
                    $(selector2).attr('id-transparent', 'inputImgName');
                }
                var cleared_name = $(selector1).val();
                if(!checkIfAlreadyWritten(cleared_name)){
                    console.log("Cleared_name:"+cleared_name);
                    simpleStorage.set(b, cleared_name, {TTL: 0});
                    $(selector1).val('');
                } else{
                    $(selector1).css('backgroundColor', 'lightGreen');
                    $(selector1).parent().parent().addClass('present');
                }

            }

            // hide empty student div
            for (var z = x+1; z <= simpleStorage.get("nbStudent"); z++) {
                console.log("name-form hide: "+z);
                var selector1 = "[id='name-form'][data-id='"+z+"']";
                $(selector1).hide();
            }

            $('#nav-bar').hide();
            $('#verify*').show();
            $('#trash*').hide();
            $('#record*').hide();

        } else {

            // Professor View
            // 1. Show all text fields
            // 2. Re-Populate emptied fields
            // 3. Show navigation bar
            // 4. Show activity buttons (#trash, #record)
            // 5. Hide Class-name heading as well as "OK" (#verify) button

            $('#name-form*').show();

            for (var y = 1; y < simpleStorage.get("nbStudent"); y++) {
                console.log("Repopulate name fields: "+y);
                var selector1 = "[id='name-input'][data-id='"+y+"']";
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

            // initilalize the color picker
            $('#mycp')
                .colorpicker({
                    inline: true,
                    container: true
                })
                .on('colorpickerChange colorpickerCreate', function (e) {
                    $('body').css('background-color', e.color.toRgbString());
                    simpleStorage.set('backgroundColor', e.color.toRgbString());
                });

        }
};


function urlQueryHandler( query ) {

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
};

function refreshNames () {
    $('.loader').css('display', 'block');
    // Fetch all image thumbnails and meta-data from IndexedDB
    // Image is a Blob-object (Binary Large Object)

    var name = null;
    names = [];
    console.log("RefreshNames");
    nameDB.fetchNames( function(names) {
        console.log("Names db.length="+names.length);
        // Piggy-bag number of images in the indexedDB database for later use
        simpleStorage.set('count', names.length, {TTL: 0});

        //Simple man's shuffle i.e. reverse order disabled
        //for(var a = 0; a < names.length; a++) {
        for(var a = names.length; a > 0; a--) {

            name = names[(names.length - 1 - a)];
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
                        content = $('<img>').append(img)
                            .attr('src', img.src || img.toDataURL())
                            .attr('tabindex',"-1");
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
                    .prop('disabled', true)
                    .attr('data-id', dataID)
                    .attr('value', name.title)
                    .attr('key', name.timestamp);
                hidden.replaceWith(more);
                console.log("Populate name with Data-id="+dataID);
                var selector1 = "[name='name-input'][data-id='"+dataID+"']";
                var fnameValue = name.title;
                $(selector1).val(fnameValue);
            } else {
                console.log("Loadimage from blob failed");
                result.children().replaceWith(
                    $('<span>Your browser does not support the URL or FileReader API.</span>')
                );
            };
        };
        radioViewHandler();
        $('.loader').css('animation', 'none');
        $('.loader').css('display', 'none');
    });
};

function makeUnselectable( target ) {
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
};

function displayImage(file, options) {
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
                content = $('<img>').append(img)
                    .attr('src', img.src || img.toDataURL())
                    .attr('tabindex', "-1");
                $('#Tlabel').replaceWith(content);
                hidden = $('#Ilabel');
                dataID = hidden.attr('data-id') || "";
                var fnameValue = file.name;
                console.log(file.name);
                // Strip image file postfix e.g. ".gif"
                if (fnameValue.lastIndexOf(".") > 0) {
                    fnameValue = fnameValue.substring(fnameValue.lastIndexOf("/")+1, fnameValue.lastIndexOf("."));
                }
                more = $('<input></input>').append()
                    .attr('type', 'hidden')
                    .attr('name', 'img-name')
                    .attr('data-id', dataID)
                    .attr('value', fnameValue);

                nameDB.createName(file.name, fnameValue,
                    img.src || img.toDataURL(),
                    function(name) {
                        console.log("Name created in DB: title="+name.title);
                        console.log("Name created in DB: id="+name.id);
                        console.log("Name created in DB: key="+name.timestamp);
                        more.append().attr('key', name.timestamp);
                    });
                hidden.replaceWith(more);
                console.log("Populate name with Data-id="+dataID);
                var selector1 = "[name='name-input'][data-id='"+dataID+"']";
                $(selector1).val(fnameValue);
            }
        }, options
    )) {
        result.children().replaceWith(
            $('<span>Your browser does not support the URL or FileReader API.</span>')
        );
    }
};

function createNewStudent(i){

    var classe = $( "#classe" );
    var eleve = "<div class=\"col-xl-2 col-lg-3 col-md-4 col-sm-6\" id=\"name-form\" data-id=\""+i+"\">\n" +
        "                <div class=\"eleve\" id=\"item-image\" data-id=\""+i+"\">\n" +
        "                	<a href=\"#\" id=\"Tlabel\">\n" +
        "                    	<img data-src=\"js/holder.js/100x150/gray/text:\" alt=\"\" class=\"img-fluid\">\n" +
        "                    </a>\n" +
        "                    <div class=\"input-group input-img-name\" >\n" +
        "                    	<input class=\"form-control\" name=\"img-name\" data-id=\""+i+"\" type=\"hidden\" id=\"Ilabel\">\n" +
        "                    </div>\n" +
        "                    <div class=\"input-group\" >\n" +
        "                        <input type=\"text\" name=\"name-input\" class=\"form-control\" data-id=\""+i+"\" id=\"name-input\" placeholder=\"Ton prénom\">\n" +
        "                        <div class=\"input-group-append\">\n" +
        "                            <button class=\"btn btn-success\" id=\"verify\" type=\"button\" title=\"Valider\" data-id=\""+i+"\">OK</button>\n" +
        "                            <button class=\"btn btn-danger\" id=\"trash\" data-id=\""+i+"\" title=\"Supprimer\">Supp </button>\n" +
        "                        </div>\n" +
        "                    </div>\n" +
        "                </div>\n" +
        "    	</div>";

    var html = $.parseHTML( eleve );

    classe.append( html );

    $('#verify*').hide();
};

function loadConfig() {

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
    if (simpleStorage.get('shuffle')) {
        $('#shuffle').prop('checked', true);
    } else {
        $('#shuffle').removeAttr('checked');
    }
    if (simpleStorage.get('lectureLettres')) {
        $('#lecture-lettres').prop('checked', true);
    } else {
        $('#lecture-lettres').removeAttr('checked');
    }
    if (simpleStorage.get('afficherNoms')) {
        $('#afficher-nom').prop('checked', true);
    } else {
        $('#afficher-nom').removeAttr('checked');
    }

    var nbStudent = simpleStorage.get('nbStudent');
    if(nbStudent === ""){
        $('#nb-student').val("0");
    } else {
        $('#nb-student').val(nbStudent);
    }

    $('#class-name').val(simpleStorage.get('className'));

    $('body').css('backgroundColor', simpleStorage.get('backgroundColor'));

    populateMain();
};


function saveConfig(mode) {

        // Save configuration settings from individual pop-up window
        // store values to SimpleStorage API

        if(mode== 'p'){
            var studentView = false;
            var teacherView = true;
        } else {
            var studentView = true;
            var teacherView = false;
        }

        console.log("Saving options...");
        var caseSense = $('#case-sense')[0].checked;
        var accentSense = $('#accent-sense')[0].checked;
        var shuffleSense = $('#shuffle')[0].checked;
        var lectureLettres = $('#lecture-lettres')[0].checked;
        var afficherNoms = $('#afficher-nom')[0].checked;
        var className = $('#class-name').val();
        var nbStudent = $('#nb-student').val();
        if(nbStudent===""){
            nbStudent = 0;
        }
        var backgroundColor= $("body").css("background-color");

        simpleStorage.set('caseSense', caseSense, {TTL: 0});
        simpleStorage.set('accentSense',accentSense, {TTL: 0});
        simpleStorage.set('lectureLettres',lectureLettres, {TTL: 0});
        simpleStorage.set('studentView',studentView, {TTL: 0});
        simpleStorage.set('teacherView',teacherView, {TTL: 0});
        simpleStorage.set('className', className, {TTL: 0});
        simpleStorage.set('nbStudent', nbStudent, {TTL: 0});
        simpleStorage.set('shuffle', shuffleSense, {TTL: 0});
        simpleStorage.set('afficherNoms', afficherNoms, {TTL: 0});
        simpleStorage.set('backgroundColor', backgroundColor, {TTL: 0});
};

function initialize(e){


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
    radioViewHandler();

    // Example usage - /?mode=P (Professor) or /?mode=E (Eleve)
    // Determine Professor or Student mode in the URL
    // Prepare User view accordingly
    var url_param = urlQueryHandler('mode');
    if( url_param ) {
        console.log("Url_param true");
        if (url_param == 'e' || url_param == 'E') {
            saveConfig('e');
        }
        if (url_param == 'p' || url_param == 'P') {
            saveConfig('p');
        }
    }

    // automatically deleting student presences
    var timeForPresence = simpleStorage.get("timeForPresence");
    if(timeForPresence === null){
        simpleStorage.set("timeForPresence", Date.now());
    }

    var hours = Math.abs(timeForPresence - Date.now()) / 36e5;
    if(hours > NB_HOURS_REINITIALISATION){
        simpleStorage.set("rightNames", []);
        simpleStorage.set("timeForPresence", Date.now());
    }

};
