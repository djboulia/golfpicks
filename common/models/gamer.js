module.exports = function (Gamer) {

    Gamer.login = function (user, pass, cb) {
        console.log("logging in user " + user);

        Gamer.find("", function (err, gamers) {

            if (gamers) {

                var match = undefined;

                for (var i = 0; i < gamers.length; i++) {
                    var gamer = gamers[i];

                    if (gamer.attributes) {
                        if (gamer.attributes.username == user && gamer.attributes.password == pass) {
                            match = gamer;
                        }
                    }
                }

                if (match) {
                    cb(null, match);
                } else {
                    cb("Invalid login", null);
                }

            } else {
                cb(err, null);
            }

        });

    };


    Gamer.remoteMethod(
        'login', {
            http: {
                path: '/login',
                verb: 'post'
            },
            description: 'Login the current user',
            accepts: [{
                    arg: 'user',
                    description: 'Email address of user',
                    type: 'string'
                },
                {
                    arg: 'password',
                    description: 'Password for user',
                    type: 'string'
                }],
            returns: {
                arg: 'gamer',
                type: 'object',
                root: true
            }
        }
    );

};
