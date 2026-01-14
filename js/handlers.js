/*
*       All application handlers here
*/


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


// Reset database action handler after user confirmation, and reset saved presence
$("#reset").on('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    $.confirm({
        title: 'Supprimer?',
        content: 'Voulez-vous vraiment supprimer la classe?',
        buttons: {
            confirmer: function () {
                nameDB.clearObjectStore( function() {
                    console.log("Object store reset");
                });
                simpleStorage.set("nbStudent", 0);
                $('#nb-student').val(simpleStorage.get('nbStudent'));
                var arr = simpleStorage.get("rightNames");
                if(arr != null){
                    arr = [];
                    simpleStorage.set("rightNames", arr);
                }
                location.reload();
                populateMain();
            },
            annuler: function () {
                $.alert('Suppression annulée.');
            }
        }
    });

});


/* Click on the eleve-mode button */
$("#eleve-mode").on('click', function (e) {
    saveConfig('e');
    initialize(e);
    window.location.href = "?mode=e";
});


/* Click on effacer presences button*/
$("#effacerPresences").on('click', function (e) {
    $.confirm({
        title: 'Supprimer?',
        content: 'Voulez-vous vraiment supprimer les présences?',
        buttons: {
            confirmer: function () {
                simpleStorage.set("rightNames", []);
                simpleStorage.set("timeForPresence", Date.now());
                $.alert('Les présences ont été supprimées.');
            },
            annuler: function () {
                $.alert('Suppression annulée.');
            }
        }
    });

});

// Handler for options checkbox
$( "input[type='checkbox']" ).change(function() {
    if($(this).val() === "case-sense"){
        simpleStorage.set('caseSense', $(this).prop('checked'), {TTL: 0});
    }
    if($(this).val() === "afficherNoms"){
        simpleStorage.set('afficherNoms', $(this).prop('checked'), {TTL: 0});
    }

    if($(this).val() === "case-accent"){
        simpleStorage.set('accentSense',$(this).prop('checked'), {TTL: 0});
    }

    if($(this).val() === "shuffle"){
        simpleStorage.set('shuffle', $(this).prop('checked'), {TTL: 0});
    }

    if($(this).val() === "lireLettres"){
        simpleStorage.set('lectureLettres',$(this).prop('checked'), {TTL: 0});
    }


    console.log("event: "+ $(this).val() + " checked: " + $(this).prop('checked'));
});

// handler for class name
$( "#class-name" ).change(function() {
    simpleStorage.set('className', $(this).val(), {TTL: 0});
});


/* Click on item image */
$('body').on('click', '.item-image*', function (e) {
    var nb = $(this).attr("data-id");
    var selector1 = "[name='name-input'][data-id='"+nb+"']";
    $(selector1).focus();
});

$('body').on('input', '#name-input*', function (e) {
    if(simpleStorage.get("studentView") && simpleStorage.get('lectureLettres')){
        // Récupérer le dernier caractère tapé
        var val = $(this).val();
        if (val.length > 0) {
            var lastChar = val.charAt(val.length - 1);
            lireLettres(lastChar);
        }
    }
});


$('body').on('click', '#verify*', function (e) {
    e.stopPropagation();
    e.preventDefault();
    var id = parseInt(e.target.getAttribute('data-id')); // data id of button clicked
    console.log("id clicked= " + id);
    playSoundHandler(id);
});


$('body').on('click', '#trash*', function (e) {
    e.stopPropagation();
    e.preventDefault();
    var id = parseInt(e.target.getAttribute('data-id'));
    deleteThumbnailHandler(id);
});



// Text input -field handler when new text entered
$('body').on('input', '#name-input*', function (e) {
    e.stopPropagation();
    e.preventDefault();
    var value = $(this).val();
    var id = parseInt(e.target.getAttribute('data-id'));
    console.log("input detected on data-id:"+id+"="+value);
    var selector2 = "[name='img-name'][data-id='"+id+"']";
    var key = $(selector2).attr('key') || "";
    console.log("key:"+key);
    var teacherView = simpleStorage.get('teacherView');
    console.log("teacherView =",teacherView);
    if (teacherView)
    {
        nameDB.updateName(value, key, function (name) {
            console.log("IndexedDB updated: "+name.title);
            $.notify({
                // options
                message: 'Prénom sauvegardé!',
            },{
                // settings
                element: 'body',
                position: null,
                type: "success",
                allow_dismiss: true,
                placement: {
                    from: "top",
                    align: "right"
                },
                offset: 20,
                spacing: 10,
                z_index: 1031,
                delay: 100,
                timer: 100,
            });
        });
    }
});


