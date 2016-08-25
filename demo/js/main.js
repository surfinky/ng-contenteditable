/* Just some whacked together jQuery for page effects... :-P */

$(document).ready(function() {

    $("img.lazy").lazyload({
        threshold: 200, // Start loading 200 px before it is in viewport.
        effect: "fadeIn",
        effectspeed: 600,
        load: function(elements_left, settings) {
            $(".lazy-container").has(this).addClass('loaded');
            $(".loaded .spinner").remove();
            $('[data-spy="scroll"]').each(function() {
                var $spy = $(this).scrollspy('refresh');
            });
        }
    });

    $('.scroll[href^="#"]').bind('click.smoothscroll', function(e) { // For link scrolling effect.
        e.preventDefault();
        var target = this.hash;
        $target = $(target);
        $('html, body').stop().animate({
            'scrollTop': $target.offset().top
        }, 900, 'swing', function() {
            window.location.hash = target;
        });
    });

    ($('.collapse')
        .on('show.bs.collapse', function() { // Update accordion icons.
            $(this).parent().find(".fa-plus").removeClass("fa-plus").addClass("fa-minus");
            $(this).parent().find(".panel-heading").addClass("active");
        })
        .on('hide.bs.collapse', function() { // Update accordion icons.
            $(this).parent().find(".fa-minus").removeClass("fa-minus").addClass("fa-plus");
            $(this).parent().find(".panel-heading").removeClass("active");
        })
    );


    $('.nav .scroll').click(function(e) { // Close menu in mobile view.
        if ($('.navbar-toggle').is(":visible"))
        $("#nav-collapse").removeClass("in").addClass("collapse");
    });

});
