/**
 * Connect to our data source and expose API end points
 * for this model.
 * 
 */
const Gamer = function (modelServer, model) {

    model.login = async function (user, password) {
        console.log("logging in user " + user);

        const gamers = await model.findAll()
            .catch((err) => {
                throw new Error(err);
            })

        if (gamers) {
            var match = undefined;

            for (var i = 0; i < gamers.length; i++) {
                var gamer = gamers[i];

                if (gamer.attributes) {
                    if (gamer.attributes.username == user && gamer.attributes.password == password) {
                        match = gamer;
                    }
                }
            }

            if (match) {
                return match;
            } else {
                throw new Error("Invalid login");
            }

        } else {
            throw new Error(err);
        }
    }

    // expose the create, read, update methods from this model
    modelServer.addCrudMethods(model);

    // add any additional entry points here
    modelServer.method(
        '/login',
        'POST',
        [
            {
                name: 'user',
                source: 'body.param',
                type: 'string'
            },
            {
                name: 'password',
                source: 'body.param',
                type: 'string'
            },
        ],
        model.login
    );

}

module.exports = Gamer;