var app = angular.module('app.services', []);
/** 
 * The Business Club (www.thebusinessclub.com)
 * ================================================
 * PLUSPRO (OS) PVT LTD - Sri Lanka
 * Developer : Mohamed Rimsan - rimsnet@gmail.com
 * Designer  : Mohamed Fazlan - mffazlan@gmail.com
 * Date      : 2017-02-30 
 * API URL   : api.thebusinessclub.com/api/v2/
 * 
 * =================================================
 * Ionic 1 - Angularjs v3.2.1 - WARNING - DANGER
 * =================================================
 * Note :  - Make your habbit read - blog.ionic.io 
 *         - Don't add Cache too much.
 *         - Don't add $rootScope - app will slow.
 *         - Don't use too many $scope variable use
 *           javascript Var xx variables.
 *         - Each page should be Controllers & .html.
 *         - Minimize URL routings.
 *         - Don't change the Scrol functions.
 * */
app.service('Blog', function ($http, $q) {
    var get = function (url) {
        return $q(function (resolve, reject) {
            $http.get(url).success(function (x) {
                resolve(x);
            }).error(function (err) {
                reject(err);
            });
        });
    };

    return {
        get: get
    };
});

app.factory('Data', function ($http, $q, TBC) {
    return {
        send: function (data, url) {
            return $q(function (resolve, reject) {
                $http({
                    method: 'POST',
                    url: TBC.URL + url,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    transformRequest: function (obj) {

                        var p, str;
                        str = [];
                        for (p in obj) {
                            str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
                        }
                        return str.join('&');
                    },
                    data: data
                }).success(function (x) {


                    resolve(x);

                }).error(function (err) {


                    reject(err);
                });


            });


        },
        get: function (x) {
            return $q(function (resolve, reject) {
                $http.get(TBC.URL + x).success(function (x) {
                    resolve(x);
                }).error(function (err) {
                    reject(err);
                });
            });
        }
    };
});


app.factory('TbcAuthService', function ($q, $http) {
    var LOCAL_TOKEN_KEY = "";
    var id = '';
    var username = '';
    var email = '';
    var name = '';

    var isAuthenticated = false;
    var role = '';
    var authToken;

    function loadUserCredentials() {
        var user = window.localStorage.getItem(LOCAL_TOKEN_KEY);
        if (user) {
            useCredentials(user);
        }
    }

    function storeUserCredentials(user) {
        window.localStorage.setItem(LOCAL_TOKEN_KEY, user.api_key);
        useCredentials(user);
    }

    function useCredentials(user) {
        id = user.id;

        name = user.contact_name;


        isAuthenticated = true;
        authToken = user.api_key;
        $http.defaults.headers.common['X-Auth-Token'] = user.api_key;

    }

    function destroyUserCredentials() {
        authToken = undefined;

        id = '';
        username = '';
        email = '';
        name = '';

        isAuthenticated = false;
        $http.defaults.headers.common['X-Auth-Token'] = undefined;
        window.localStorage.removeItem(LOCAL_TOKEN_KEY);
    }

    var getFileUploadPermission = function () {
        permissions = window.cordova.plugins.permissions;
        permissions.checkPermission(permissions.READ_EXTERNAL_STORAGE, function (status) {
            if (!status.hasPermission) {
                permissions.requestPermission(permissions.READ_EXTERNAL_STORAGE, success, error);

                function error() {
                    console.warn('READ_EXTERNAL_STORAGE permission is not turned on');
                }

                function success(status) {
                    if (!status.hasPermission) error();
                }
            }
        });
    };

    var logout = function (id, os) {
        destroyUserCredentials();

    };

    var isAuthorized = function (authorizedRoles) {
        if (!angular.isArray(authorizedRoles)) {
            authorizedRoles = [authorizedRoles];
        }
        return (isAuthenticated && authorizedRoles.indexOf(role) !== -1);
    };

    loadUserCredentials();

    return {
        logout: logout,
        storeUserCredentials: storeUserCredentials,
        isAuthorized: isAuthorized,
        getFileUploadPermission: getFileUploadPermission,
        isAuthenticated: function () {
            return isAuthenticated;
        },
        id: function () {
            return id;
        },
        name: function () {
            return name;
        },
        username: function () {
            return username;
        },
        email: function () {
            return email;
        },
        authToken: function () {
            return authToken;
        },
        role: function () {
            return role;
        }
    };
});