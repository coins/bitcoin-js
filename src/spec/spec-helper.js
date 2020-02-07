beforeEach(function() {
    jasmine.addMatchers({
        toBePlaying: function() {
            return {
                compare: function(actual, expected) {
                    let player = actual;

                    return {
                        pass: player.currentlyPlayingSong === expected && player.isPlaying
                    };
                }
            };
        }
    });
});