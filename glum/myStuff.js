(function () {

    // JavaScript strict mode is a good thing.
    "use strict";

    // Define a unique global namespace for your stuff.
    // You should change this to a namespace that is appropriate for your project.
    fluid.registerNamespace("myStuff");

    var environment = flock.init();

    // Expose any public functions or constructors as properties on your namesapce.
    myStuff.play = function () {
        var mySynth = flock.synth({
          synthDef: {
              ugen: "flock.ugen.saw",
              freq: {
                  ugen: "flock.ugen.mouse.cursor",
                  rate: "control",
                  leakRate: 0.1,
                  mul: 880,
                  add: 110,
                  options: {
                      axis: "width",
                      target: "#magic"
                  }
              },
              mul: {
                  ugen: "flock.ugen.mouse.click",
                  rate: "control",
                  options: {
                      axis: "height",
                      target: "#magic"
                  },
                  mul: 0.5
              }
          }
        });

        // If you're on iOS, you will need to call in a listener for
        // some kind of user input action, such a button click or touch handler.
        // This is because iOS will only play sound if the user initiated it.
        environment.start();
    };

}());
