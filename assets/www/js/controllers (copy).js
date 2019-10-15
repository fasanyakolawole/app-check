var app = angular.module('app.controllers', []);
var api_key = '';
app.filter('trusted', function ($sce) {
    return function (url) {
        return $sce.trustAsHtml(url);
    };
});
app.filter('discount', function () {
    return function (x) {
        return (x.regular_price - x.price) / x.regular_price * 100;
    };
});
app.directive('focusMe', function ($timeout) {
    return {
        link: function (scope, element, attrs) {
            $timeout(function () {
                element[0].focus();
            }, 150);
        }
    };
});
app.filter('unique', function () {
    return function (collection, keyname) {
        var output = [],
            keys = [];
        angular.forEach(collection, function (item) {
            var key = item[keyname];
            if (keys.indexOf(key) === -1) {
                keys.push(key);
                output.push(item);
            }
        });
        return output;
    };
});

app.directive('compile', ['$compile', function ($compile) {
    return function (scope, element, attrs) {
        scope.$watch(
            function (scope) {
                return scope.$eval(attrs.compile);
            },
            function (value) {
                element.html(value);
                $compile(element.contents())(scope);
            }
        );
    };
}]);

app.controller('AppCtrl', function ($http, $scope, Data, TbcAuthService, TBC, $ionicModal, $window, $stateParams, $ionicPlatform, $state, $ionicPopup, $ionicPlatform, $cordovaDialogs, $rootScope, $timeout, $ionicLoading, $ionicSideMenuDelegate, $state) {
    /** 
     * TBC Main Controller index.html Configurations
     * ===============================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer    : Mohamed Rimsan - rimsnet@gmail.com
     * Controller   : AppCtrl
     * Main Method  : app.controller('AppCtrl',function(......){});
     * Scope Method : userDataGet(key), openLogin(), closeLogin(),
     *                openRegister(), closeRegister, showImages(index), 
     *                showModal(t-url), closeModal(), signOut(),
     *                signInUser(user), seeMoreFriends(), rateApp(),
     *                showSuccess(txt,tm), showError(txt,tm),
     *                signUpUser(user), openReport(ths,frm),
     *                closeReport(), doReport(tx,th,frm),
     *                forgotPassword(eml), 
     *                 
     * Date         : 2017-03-05
     * ===============================================================
     * */
    api_key = window.localStorage.getItem('userkey');
    $rootScope.chat_history = [];

    $rootScope.new_individual_msg = 0;
    /** 
     * AppCtrl - get user details
     * ===================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer : Mohamed Rimsan - rimsnet@gmail.com
     * Method : $scope.userDataGet(key)
     * Date  : 2017-03-10
     * ====================================================
     * */
    $scope.userDataGet = function (api_key) {
        Data.send({
            api_key: api_key
        }, 'user').then(function (res) {
            if (res.success == 1) {
                $rootScope.appUserData = res.user;
                $rootScope.initUser = res.user.login_action;
                $rootScope.userImagewithUrl = res.user.image_url + res.user.user_image;
                $rootScope.userApiKey = api_key;
                $rootScope.activation_active = res.activation_active;
                window.localStorage.setItem('activation_active', res.activation_active);
                var storeUser = {
                    id: res.user.id,
                    api_key: api_key,
                    name: res.user.contact_name,
                    login_action: res.user.login_action
                };
                TbcAuthService.storeUserCredentials(storeUser);
            }else{
                
                window.localStorage.removeItem('userkey');
                // TbcAuthService.logout();
                $state.go('app.welcome');
                // location.reload();

            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });
        $ionicPlatform.ready(function () {
            document.addEventListener("deviceready", onDeviceReady, false);

            function onDeviceReady() {
                window.plugins.OneSignal.getIds(function (ids) {
                    var token = ids.pushToken;
                    var platform = device.platform;
                    var platform_version = device.version;
                    var registrationId = device.uuid;
                    var device_token = ids.userId;
                    Data.send({
                        api_key: api_key,
                        device_id: token,
                        platform: platform,
                        platform_version: platform_version,
                        registrationId: device_token
                    }, 'registerForPushes').then(function (res) {}, function (x) {
                        $scope.showError("Check your connection!");
                    });
                });
            }
        });
    };
    if (api_key != null || api_key != '') {
        $rootScope.userApiKey = api_key;
        $http.defaults.headers.common['X-Auth-Token'] = api_key;
        $scope.userDataGet($rootScope.userApiKey);
        $rootScope.loginStatus = true;
    } else {
        $rootScope.loginStatus = false;
    }
    $ionicModal.fromTemplateUrl('templates/welcome/login.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalLogin = modal;
    });
    $scope.openLogin = function () {
        $rootScope.progressPercent = 0;
        $scope.modalLogin.show();
    };
    $scope.closeLogin = function () {
        $scope.modalLogin.hide();
    };
    $ionicModal.fromTemplateUrl('templates/welcome/register.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $rootScope.modalRegister = modal;
    });
    var openShowRegister = false;
    $rootScope.openRegister = function () {
        openShowRegister = true;
        $rootScope.modalRegister.show();
    };
    $rootScope.closeRegister = function () {
        if (openShowRegister == true) {
            openShowRegister = false;
            $rootScope.modalRegister.hide();
        }
    };
    var user = window.localStorage.getItem('userkey');
    if (user == null || user == '') {
        $state.go('app.welcome', {}, {
            reload: true
        });
    } else {
        $rootScope.loginStatus = true;
        $state.go('app.dash', {}, {
            reload: true
        });
    }
    $scope.zoomMin = 1;
    $scope.screenHeight = $window.innerHeight;
    $scope.showImages = function (index) {
        $scope.activeSlide = index;
        $scope.showModal('templates/product-zoom.html');
    };

    $scope.directToPostLink = function (url) {

        window.open(url, '_system');
    };

    $scope.showModal = function (templateUrl) {
        $ionicModal.fromTemplateUrl(templateUrl, {
            scope: $scope
        }).then(function (modal) {
            $scope.modal = modal;
            $scope.modal.show();
        });
    };
    $scope.closeModal = function () {
        $scope.modal.hide();
        $scope.modal.remove();
    };

    $scope.toggleGroup = function (group) {
        if ($scope.isGroupShown(group)) {
            $scope.shownGroup = null;
        } else {
            $scope.shownGroup = group;
        }
    };

    $scope.isGroupShown = function (group) {
        return $scope.shownGroup === group;
    };

    /** 
     * AppCtrl - Signout 
     * ===================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer : Mohamed Rimsan - rimsnet@gmail.com
     * Method : $scope.signout()
     * Date  : 2017-03-10
     * ====================================================
     * */
    $scope.signOut = function () {

        if (ionic.Platform.isAndroid()) {

            $ionicLoading.show({
                template: '<ion-spinner icon="dots"></ion-spinner><br>login out...'
            });

            document.addEventListener("deviceready", onDeviceReady, false);

            function onDeviceReady() {
                window.plugins.OneSignal.getIds(function (ids) {

                    var device_token = ids.userId;
                    
                    Data.send({
                        api_key: api_key,
                        device_token: device_token

                    }, 'logout_push').then(function (res) {

                        if(res.success == 1){

                            $ionicLoading.hide();
                            $rootScope.loginStatus = false;
                            for (var prop in $rootScope) {
                                if (prop.substring(0, 1) !== '$') {
                                    delete $rootScope[prop];
                                }
                            }
                            window.localStorage.removeItem('userkey');
                            $rootScope.main_wall = [];
                            $ionicSideMenuDelegate.toggleLeft();
                            $http.defaults.headers.common['X-Auth-Token'] = '';
                            // TbcAuthService.logout();
                            location.reload();
                            $state.go('app.welcome');



                        }

                    }, function (x) {
                        $ionicLoading.hide();
                        $scope.showError("Check your connection!");

                    });
                });
            }

            
        }

        if (ionic.Platform.isIOS()) {

            $ionicLoading.show({
                template: '<ion-spinner icon="dots"></ion-spinner><br>login out...'
            });
            document.addEventListener("deviceready", onDeviceReady, false);

            function onDeviceReady() {
                window.plugins.OneSignal.getIds(function (ids) {

                    var device_token = ids.userId;

                    Data.send({
                        api_key: api_key,
                        device_token: device_token

                    }, 'logout_push').then(function (res) {

                        if(res.success == 1){

                            $ionicLoading.hide();
                            $rootScope.loginStatus = false;
                            for (var prop in $rootScope) {
                                if (prop.substring(0, 1) !== '$') {
                                    delete $rootScope[prop];
                                }
                            } 
                            window.localStorage.removeItem('userkey');
                            $rootScope.main_wall = [];
                            $ionicSideMenuDelegate.toggleLeft();
                            $http.defaults.headers.common['X-Auth-Token'] = '';
                            
                            var initialHref = window.location.href;
                            navigator.splashscreen.show();
                            // Reload original app url (ie your index.html file)
                            window.location = initialHref;
                            navigator.splashscreen.hide();
                            
                            $state.go('app.welcome', {}, {reload: true});
                            window.location.reload();
                            // $state.go('app.welcome');

                        }

                    }, function (x) {
                        $ionicLoading.hide();
                        $scope.showError("Check your connection!");

                    });
                });
            }

        }

        else{

            $ionicLoading.show({
                template: '<ion-spinner icon="dots"></ion-spinner><br>login out...'
            });
            Data.send({
                api_key: api_key
            }, 'logout_push').then(function (res) {
                $ionicLoading.hide();
                $rootScope.loginStatus = false;
                for (var prop in $rootScope) {
                    if (prop.substring(0, 1) !== '$') {
                        delete $rootScope[prop];
                    }
                }
                window.localStorage.removeItem('userkey');
                $rootScope.main_wall = [];
                $ionicSideMenuDelegate.toggleLeft();
                $http.defaults.headers.common['X-Auth-Token'] = '';
                // TbcAuthService.logout();
                location.reload();
                $state.go('app.welcome');

            }, function (x) {
                $ionicLoading.hide();
                $scope.showError("Check your connection!");

            });

        }


    };
    /** 
     * AppCtrl - Login user 
     * ===================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer : Mohamed Rimsan - rimsnet@gmail.com
     * Method : $scope.signInUser(user)
     * Date  : 2017-03-10
     * ====================================================
     * */
    $scope.signInUser = function (user) {
        $scope.userDetails = "";
        $ionicLoading.show();
        Data.send({
            user_email: user.email,
            log_user_psw: user.password
        }, 'login').then(function (res) {
            if (res.success == 1) {
                window.localStorage.setItem('userkey', res.api_key);
                $rootScope.loginStatus = true;
                $rootScope.activation_active = res.activation_active;
                $rootScope.userApiKey = res.api_key;
                $scope.userLogged = true;
                $scope.loggedin = 1;
                $rootScope.userkey = true;
                $scope.userDataGet(res.api_key);
                $scope.loggedUserKey = res.api_key;
                var storeUser = {
                    api_key: res.api_key
                };
                $http.defaults.headers.common['X-Auth-Token'] = res.api_key;
                $rootScope.initUser = res.login_action;
                $ionicPlatform.ready(function () {
                    /** 
                     * AppCtrl - Push Register into TBC database
                     * ===================================================
                     * PLUSPRO (OS) PVT LTD - Sri Lanka
                     * Developer : Mohamed Rimsan - rimsnet@gmail.com
                     * Method :window.plugins.OneSignal.getIds(fucntion(){})
                     * Date  : 2017-04-24
                     * ====================================================
                     * */
                    document.addEventListener("deviceready", onDeviceReady, false);

                    function onDeviceReady() {
                        window.plugins.OneSignal.getIds(function (ids) {
                            var token = ids.pushToken;
                            var platform = device.platform;
                            var platform_version = device.version;
                            var registrationId = device.uuid;
                            var device_token = ids.userId;
                            Data.send({
                                api_key: res.api_key,
                                device_id: token,
                                platform: platform,
                                platform_version: platform_version,
                                registrationId: device_token
                            }, 'registerForPushes').then(function (res) {}, function (x) {
                                $scope.showError("Check your connection!");
                            });
                        });
                    }
                });
                $ionicLoading.hide();
                $scope.modalLogin.hide();
                $state.transitionTo('app.dash', $stateParams, {
                    reload: true,
                    inherit: false,
                    notify: true
                });
            } else if(res.success == 2){
                $ionicLoading.hide();
                $scope.showPopupActivationCode(res.api_key, res.message);
            } else {
                $ionicLoading.hide();
                $scope.showError('Please check your username and password');
            }
        }, function (x) {
            $scope.showError("Check your connection!");
            $scope.userLogged = false;
        });
    };
    $scope.seeMoreFriends = function () {
        Data.send({
            api_key: api_key,
            friend_id: $stateParams.friendid
        }, 'seeMoreFriends').then(function (res) {
            $scope.my_friends = res.friends;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.default_connection = 1;
    $scope.default_gb = 4;
    $scope.default_product = 89;
    $scope.default_lines = 0;
    $scope.default_lines_needed = 1;
    $scope.default_speed = 24;
    $scope.appname = TBC.name;
    $scope.appversion = TBC.version;
    /* RATE APP */
    $scope.rateApp = function () {
        document.addEventListener("deviceready", function () {
            AppRate.preferences.useLanguage = 'en';
            var popupInfo = {};
            popupInfo.title = TBC.name;
            popupInfo.message = "You like " + TBC.name + " We would be glad if you share your experience with others. Thanks for your support!";
            popupInfo.cancelButtonLabel = "No, thanks";
            popupInfo.laterButtonLabel = "Remind Me Later";
            popupInfo.rateButtonLabel = "Rate Now";
            AppRate.preferences.customLocale = popupInfo;
            AppRate.preferences.usesUntilPrompt = 1;
            AppRate.preferences.promptAgainForEachNewVersion = true;
            AppRate.preferences.openStoreInApp = true;
            AppRate.preferences.storeAppURL.ios = '849930087';
            AppRate.preferences.storeAppURL.android = 'market://details?id=tbc.com.app';
            AppRate.promptForRating(true);
        }, false);
    };
    /* END RATE APP */
    var tmp = [];
    $scope.$on('$stateChangeSuccess', function () {
        var user = window.localStorage.getItem('userkey');
        if (user == null || user == '') {}
    });
    /** 
     * AppCtrl - Re-use success alert 
     * ===================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer : Mohamed Rimsan - rimsnet@gmail.com
     * Method : $scope.showSuccess(txt,time)
     * Date  : 2017-03-11
     * ====================================================
     * */
    $scope.showSuccess = function (x, time) {
        var time = time ? time : 2000;
        $ionicLoading.show({
            template: '<div class="info"><i class="icon ok ion-ios-checkmark"></i></div><div>' + x + '</div>'
        });
        $timeout(function () {
            $ionicLoading.hide();
        }, time);
    };
    /** 
     * AppCtrl - Re-use error alert 
     * ===================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer : Mohamed Rimsan - rimsnet@gmail.com
     * Method : $scope.showError(txt,time)
     * Date  : 2017-03-11
     * ====================================================
     * */
    $scope.showError = function (x, time) {
        var time = time ? time : 4000;
        $ionicLoading.show({
            template: '<div class="info"><i class="icon err ion-sad-outline"></i></div><div>' + x + '</div>'
        });
        $timeout(function () {
            $ionicLoading.hide();
        }, time);
    };
    /** 
     * AppCtrl - Exit Back Action 
     * ===================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer : Mohamed Rimsan - rimsnet@gmail.com
     * Method : $ionicPlatform.registerBackButtonAction
     * Date  : 2017-03-11
     * ====================================================
     * */
    $ionicPlatform.registerBackButtonAction(function (e) {
        e.preventDefault();
        if ($state.is('app.dash') || $state.is('app.welcome') || $state.is('app.about')) {
            e.stopPropagation();
            $cordovaDialogs.confirm('Are you sure want to exit?', 'Exit TBC', ['Yes', 'No']).then(function (buttonIndex) {
                var btnIndex = buttonIndex;
                if (btnIndex == 1)
                    ionic.Platform.exitApp();
                else
                    return false;
            });
        } else
            navigator.app.backHistory();
    }, 100);
    $scope.signUpUser = function (user) {
        $ionicLoading.show();
        Data.send({
            company_name: user.business_name,
            contact_name: user.contact_name,
            reg_user_email: user.email,
            user_psw: user.password,
            partner_id: user.partner_id
        }, 'registration').then(function (res) {

            $ionicLoading.hide();
            if (res.success == 1) {
                // $timeout(function () {
                //     $rootScope.closeRegister();
                //     $scope.showSuccess('Your Account has been successfully registered. Please check your email for Verification.', 6000);
                // }, 800);

                $rootScope.closeRegister();
                var subTitle = 'You have been successfully registered. Please check your email for the 4 Digit Verification Code';
                $scope.showPopupActivationCode(res.api_key, subTitle);

            } else {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Registration Unsuccessful',
                    subTitle: res.message,
                    buttons: [{
                        text: 'OK',
                        type: 'button-positive',
                        onTap: function (e) {
                            confirmPopup.close();
                        }
                    }]
                });
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.myPopup = null

    $scope.showPopupActivationCode = function (api_key, subTitle) {
        $scope.data = {};

        $scope.OpenOtpPopUp = function () {

          // An elaborate, custom popup
          $scope.myPopup = $ionicPopup.show({
            template: '<input class="verify-code-txtbox" type="text" ng-model="data.otp" maxlength="4"><br>'
                        + '<center> <a class="calm text-center" ng-click="resendActivationEmail(\''+api_key+'\')">Resend activation code</a> </center>',
            title: 'Enter verification code',
            subTitle: subTitle,
            scope: $scope,
            buttons: [{
                text: 'Confirm',
                type: 'button-calm',
                onTap: function (e) {
                  if ($scope.data.otp) {

                    $scope.activateAccountViaMobile(api_key, $scope.data.otp);

                    e.preventDefault();
                  } else {
                    return $scope.data.otp;
                  }
                }
            },
            {
                text: 'Cancel',
                type: 'button-calm button-outline',
                onTap: function (e) {
                    $scope.myPopup.close();
                    location.reload();
                }
            }]
          });

        }

        $scope.OpenOtpPopUp();

        $scope.myPopup.then(function (res) {
          console.log('Tapped!', res);
//            location.reload();
        });

        $timeout(function () {
          $scope.myPopup.close(); //close the popup after 3 seconds for some reason
        }, 200000000);
    };

    $scope.resendActivationEmail = function (api_key) {
        $ionicLoading.show({template: '<ion-spinner icon="dots"></ion-spinner><br>Resending Activation Email'});
        Data.send({
            api_key: api_key
        }, 'resendActivationCode').then(function (res) {
            $ionicLoading.hide();
            if(res.success == 1){
                $scope.showSuccess('Activation Email has sent successfully. Please check your email for Verification.', 2400);

            }else{
                $scope.showError('Error while sending the Activation Email');
            }

        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    

    $scope.activateAccountViaMobile = function (api_key, otpCode) {
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            otp_code: otpCode
        }, 'activateAccountViaMobile').then(function (res) {
            if (res.success == 1) {
                $scope.myPopup.close();
                window.localStorage.setItem('userkey', res.api_key);
                $rootScope.loginStatus = true;
                $rootScope.activation_active = res.activation_active;
                $rootScope.userApiKey = res.api_key;
                $scope.userLogged = true;
                $scope.loggedin = 1;
                $rootScope.userkey = true;
                $scope.userDataGet(res.api_key);
                $scope.loggedUserKey = res.api_key;
                var storeUser = {
                    api_key: res.api_key
                };
                $http.defaults.headers.common['X-Auth-Token'] = res.api_key;
                $rootScope.initUser = res.login_action;

                $ionicPlatform.ready(function () {

                    /** 
                     * AppCtrl - Push Register into TBC database
                     * ===================================================
                     * PLUSPRO (OS) PVT LTD - Sri Lanka
                     * Developer : Mohamed Rimsan - rimsnet@gmail.com
                     * Method :window.plugins.OneSignal.getIds(fucntion(){})
                     * Date  : 2017-04-24
                     * ====================================================
                     * */
                    document.addEventListener("deviceready", onDeviceReady, false);

                    function onDeviceReady() {
                        window.plugins.OneSignal.getIds(function (ids) {
                            var token = ids.pushToken;
                            var platform = device.platform;
                            var platform_version = device.version;
                            var registrationId = device.uuid;
                            var device_token = ids.userId;
                            Data.send({
                                api_key: res.api_key,
                                device_id: token,
                                platform: platform,
                                platform_version: platform_version,
                                registrationId: device_token
                            }, 'registerForPushes').then(function (res) {}, function (x) {
                                $scope.showError("Check your connection!");
                            });
                        });
                    }
                });

                $ionicLoading.hide();
                $scope.modalLogin.hide();
                $state.transitionTo('app.dash', $stateParams, {
                    reload: true,
                    inherit: false,
                    notify: true
                });
            } else {
                if (!res.message) {
                    $scope.showError('Please check your activation code again');
                } else {
                    $scope.showError(res.message);
                }
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });

    };

    $scope.openReport = function (report_this, sent_from) {
        $ionicModal.fromTemplateUrl('templates/modal/report.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalReport = modal;
            $scope.modalReport.show();
        });
        $scope.report_this = report_this;
        $scope.sent_from = sent_from;
    };
    $scope.closeReport = function () {
        $scope.modalReport.hide();
    };
    $scope.doReport = function (report, report_this, sent_from) {
        if (report == '' || report == null) {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Empty text not allowed',
                buttons: [{
                    text: 'OK',
                    type: 'button-positive',
                    onTap: function (e) {
                        confirmPopup.close();
                    }
                }]
            });
        } else {
            Data.send({
                api_key: api_key,
                report_this: report_this,
                reporting_desc: report.comments
            }, 'report').then(function (res) {
                if (sent_from == 'friends_profile') {
                    $rootScope.viewFriendsProfile();
                }
                if (sent_from == 'view_group') {}
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Sucessfully Reported this',
                    buttons: [{
                        text: 'OK',
                        type: 'button-positive',
                        onTap: function (e) {
                            $scope.closeReport();
                            confirmPopup.close();
                        }
                    }]
                });
            }, function (x) {
                $scope.showError("Check your connection!");
            });
        }
    };
    $ionicModal.fromTemplateUrl('templates/welcome/reset_password.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalPasswordReset = modal;
    });
    $scope.openPasswordReset = function () {
        $scope.modalPasswordReset.show();
    };
    $scope.closePasswordReset = function () {
        $scope.modalPasswordReset.hide();
    };
    $scope.forgotPassword = function (email) {
        Data.send({
            user_email: email
        }, 'identify').then(function (res) {
            if (res.success == 1) {
                $scope.reset_message = res.message;
                $scope.showSuccess(res.message);
                $scope.closePasswordReset();
            } else {
                $scope.reset_message = res.message;
                $scope.showError(res.message);
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.mesg = function () {
        ////console.log('changed '+ $rootScope.msg_count);

        Data.send({
            api_key: api_key,
            start: 0,
            count: 10
        }, 'getChatList').then(function (resData) {
            if (resData.success == 1)
                $rootScope.chatlist = resData.chat_list;



        }, function (x) {

        });
        $state.go('app.messaging');

    };

    $scope.var3 = 1;
    $scope.openConnRequests = function (notifications, notification_type, contact_id) {
        $state.go('app.friends_profile', {
            friendid: contact_id
        });

    };

    ionic.material.ink.displayEffect();
});
app.controller('HomeCtrl', function ($scope, $controller, $cordovaFile, $ionicLoading, $cordovaCamera, $ionicScrollDelegate, Data, TbcAuthService, $rootScope, $ionicModal, $ionicPopup, $parse) {
    /** 
     * Home Controller templates/home.html Configurations
     * ===============================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer    : Mohamed Rimsan - rimsnet@gmail.com
     * Controller   : HomeCtrl
     * Main Method  : app.controller('HomeCtrl',function(......){});
     * Reuse Method : $controller('ReuseWallCtrl', {$scope: $scope});
     * Scope Method : doRefresh(), $scope.$on('$ionicView.beforeEnter')
     *                scrollTop(),loadMore(),  *                 
     * Date         : 2017-03-12
     * ===============================================================
     * */
    api_key = window.localStorage.getItem('userkey');
    $controller('ReuseWallCtrl', {
        $scope: $scope
    });
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = false;

    });
    $scope.more = false;
    var page = 1;
    $ionicLoading.show();
    var start = 0,
        count = 10;
    $scope.scrollTop = function () {
        $ionicScrollDelegate.scrollTop();
    };

    /** 
     * HomeCtrl - Home Wall data 
     * ===================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer : Mohamed Rimsan - rimsnet@gmail.com
     * Method : $scope.doRefresh() - startup
     * Date  : 2017-03-12
     * ====================================================
     * */

    $scope.doRefresh = function () {
        $ionicLoading.show();
        start = 0;
        count = 10;
        Data.send({
            start: start,
            count: count,
            api_key: api_key
        }, 'userwallBeta1').then(function (res) {
            if (res.wall_post_count > 10) {
                $scope.more = true;
            } else {
                $scope.more = false;
            }
            if ($rootScope.activation_active == 2) {
                $scope.more = false;
                $rootScope.main_wall = [];
            } else {
                $rootScope.main_wall = JSON.parse(JSON.stringify(res)).wall_posts;
            }
            $scope.image_location_post = res.image_location_post;
            $scope.image_location_user = res.image_location_user;
            $scope.user_image = res.user_image;
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.doRefresh();

    // $scope.checkForExternalLinks = function (content, wall_post_id) {

    //     var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
    //     var result = content.replace(urlRegEx, "<a ng-click=\"directToPostLink('$1',\'_system\')\">$1</a>");

    //     // var post_content = 'post_content' + wall_post_id;

    //     var the_string = 'post_content'+wall_post_id;
    //     var model = $parse(the_string);
    //     model.assign($scope, result);

    // };
    /** 
     * HomeCtrl - Home Wall data load more
     * ===================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer : Mohamed Rimsan - rimsnet@gmail.com
     * Method : $scope.loadMore - loadmore
     * Date  : 2017-03-12
     * ====================================================
     * */
    $scope.loadMore = function () {
        start = start + 10;
        count = start + 10;
        Data.send({
            start: start,
            count: count,
            api_key: api_key
        }, 'userwallBeta1').then(function (res) {
            if ($rootScope.main_wall.length >= res.wall_post_count) {
                $scope.more = false;
            } else {
                $scope.more = true;
            }
            $rootScope.main_wall = $rootScope.main_wall.concat(JSON.parse(JSON.stringify(res)).wall_posts);
            $scope.image_location_post = res.image_location_post;
            $scope.image_location_user = res.image_location_user;
            $scope.user_image = res.user_image;
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    ionic.material.ink.displayEffect();
});
app.controller('LocalAreaCtrl', function ($scope, $ionicScrollDelegate, $timeout, $ionicLoading, Data, TBC, TbcAuthService, $ionicModal, $ionicPopup) {
    /** 
     * Local Area Controller templates/local_area.html Configurations
     * ===============================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer    : Mohamed Rimsan - rimsnet@gmail.com
     * Controller   : LocalAreaCtrl
     * Main Method  : app.controller('LocalAreaCtrl',function(......){});
     * Reuse Method : -
     * Scope Method : localNavigation(n),localConnections(), 
     *                loadMoreLocalConnections(),getAllLocalAds(),
     *                localRefresh(n),loadMoreAllLocalAds(),
     *                tbcSocialShareAds(ty,id,nme),                
     * Date         : 2017-04-18
     * ===============================================================
     * */
    api_key = window.localStorage.getItem('userkey');
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = false;
    });
    $ionicLoading.show();
    $scope.var1 = 1;
    $scope.localNavigation = function (num) {
        $scope.var1 = num;
    };
    var con_start = 0,
        con_limit = 10;
    var ads_start = 0,
        ads_limit = 10;
    $scope.ads_more = false;
    $scope.con_more = false;


    $scope.openLocalAdsFilter = function () {
        $ionicLoading.show();
        $ionicModal.fromTemplateUrl('templates/modal/filter_ads_local.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {

            Data.get('getCategoryTableList').then(function (res) {
                $scope.category_groups = JSON.parse(JSON.stringify(res)).category;

                //console.log($scope.category_groups);

                $scope.modalLocalAdsFilter = modal;
                $scope.modalLocalAdsFilter.show();
                $ionicLoading.hide();
            }, function (x) {
                $scope.showError("Check your connection!");
            });

        });
    };

    $scope.closeLocalAdsFilter = function () {
        $scope.modalLocalAdsFilter.hide();
    };


    $scope.cat_id = "All";
    $scope.sub_cat_id = "All";

    $scope.FilterLocalAds = function (location, cat_id, sub_cat_id) {
        $ionicLoading.show();

        if (cat_id) {
            //$category_id = cat_id;
            $scope.cat_id = cat_id;
            $scope.cat_start_id = cat_id;
        } else {
            //$category_id = "All";
            $scope.cat_id = "All";
        }
        if (sub_cat_id) {
            //$sub_category_id = sub_cat_id;
            $scope.sub_cat_id = sub_cat_id;
            $scope.sub_start_cat_id = sub_cat_id;
        } else {
            //$sub_category_id = "All";
            $scope.sub_cat_id = "All";
        }

        ads_start = 0;
        ads_limit = 10;
        Data.send({
            api_key: api_key,
            start: ads_start,
            count: ads_limit,
            category: $scope.cat_id,
            sub_category: $scope.sub_cat_id
        }, 'localAds').then(function (resData) {
            if (resData.success == 1) {
                $scope.local_ads = JSON.parse(JSON.stringify(resData.products));
                if (resData.product_count > 10) {
                    $scope.ads_more = true;
                } else {
                    $scope.ads_more = false;
                }
                $ionicScrollDelegate.resize();
                $scope.$broadcast('scroll.refreshComplete');
            }
            //$scope.var1 = 2;
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });


        //$ionicLoading.hide();
        $scope.closeLocalAdsFilter();
    };


    $scope.localConnections = function () {
        con_start = 0;
        con_limit = 10;
        Data.send({
            api_key: api_key,
            start: con_start,
            count: con_limit
        }, 'localConnection').then(function (resData) {
            if (resData.success == 1) {
                $scope.connections = JSON.parse(JSON.stringify(resData.users));
                if (resData.user_count > 10)
                    $scope.con_more = true;
                $ionicScrollDelegate.resize();
                $scope.$broadcast('scroll.refreshComplete');
            } else {
                $scope.connections = [];
                $scope.$broadcast('scroll.refreshComplete');
            }
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.localConnections();
    $scope.loadMoreLocalConnections = function () {
        con_start = con_start + 10;
        con_limit = con_start + 10;
        Data.send({
            api_key: api_key,
            start: con_start,
            count: con_limit
        }, 'localConnection').then(function (res) {
            $timeout(function () {
                $scope.connections = $scope.connections.concat(JSON.parse(JSON.stringify(res.users)));
                if ($scope.connections.length >= res.user_count) {
                    $scope.con_more = false;
                }
                $scope.$broadcast('scroll.infiniteScrollComplete');
            });
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.getAllLocalAds = function () {

        //$scope.cat_id = "All";
        //$scope.sub_cat_id = "All";

        if ($scope.cat_id != "All" && $scope.sub_cat_id != "All") {

            $scope.cat_id = $scope.cat_start_id;
            $scope.sub_cat_id = $scope.sub_start_cat_id;

        } else {

            $scope.cat_id = "All";
            $scope.sub_cat_id = "All";

        }


        ads_start = 0;
        ads_limit = 10;
        Data.send({
            api_key: api_key,
            start: ads_start,
            count: ads_limit,
            category: $scope.cat_id,
            sub_category: $scope.sub_cat_id
        }, 'localAds').then(function (resData) {
            if (resData.success == 1) {
                $scope.local_ads = JSON.parse(JSON.stringify(resData.products));
                if (resData.product_count > 10) {
                    $scope.ads_more = true;
                }
                $ionicScrollDelegate.resize();
                $scope.$broadcast('scroll.refreshComplete');
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });


    };
    $scope.getAllLocalAds();
    /** 
     * LocalAreaCtrl - Tabs Handling on Local Area
     * ===================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer : Mohamed Rimsan - rimsnet@gmail.com
     * Method : $scope.localRefresh(v)
     * Date  : 2017-04-18
     * ====================================================
     * */
    $scope.localRefresh = function (var1) {
        if (var1 == 1) {
            $scope.localConnections();
        }
        if (var1 == 2) {
            $scope.getAllLocalAds();
        }
    };
    $scope.loadMoreAllLocalAds = function () {

        ads_start = ads_start + 10;
        Data.send({
            api_key: api_key,
            start: ads_start,
            count: ads_limit,
            category: $scope.cat_id,
            sub_category: $scope.sub_cat_id
        }, 'localAds').then(function (res) {
            $timeout(function () {
                $scope.local_ads = $scope.local_ads.concat(JSON.parse(JSON.stringify(res.products)));
                if ($scope.local_ads.length >= res.product_count) {
                    $scope.ads_more = false;
                }
                $scope.$broadcast('scroll.infiniteScrollComplete');
            });
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    /** 
     * LocalAreaCtrl - Social sharing
     * ===================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer : Mohamed Rimsan - rimsnet@gmail.com
     * Method :  $scope.tbcSocialShareAds(t,i,nm)
     * Date  : 2017-04-18
     * ====================================================
     * */
    $scope.tbcSocialShareAds = function (type, id, name) {
        function generateRandom(min, max) {
            var num = Math.floor(Math.random() * (max - min + 1)) + min;
            return (num === 8 || num === 15) ? generateRandom(min, max) : num;
        }
        var random = generateRandom(111111, 999999);
        var gen_pro_id = random + id + random;
        var url = TBC.WEB + 'order/' + gen_pro_id;
        if (type === 'facebook') {
            window.plugins.socialsharing.shareViaFacebook(null, null /* img */ , url, null, function (errormsg) {
                // window.open('https://www.facebook.com/sharer.php?s=100&&p[caption]=dasads&p[url]='.url, '_system');
            }, function (err) {
                $scope.showError("You have to install facebook!");
            });
        }
        if (type === 'twitter') {
            var share_url = 'https://twitter.com/share?url=' + url + '&text=' + name;
            window.plugins.socialsharing.shareViaTwitter(name + ' ', null /* img */ , url, null, function (errormsg) {
                window.open(share_url, '_system');
            });
        }
        if (type === 'whatsapp') {
            window.plugins.socialsharing.shareViaWhatsApp(null, null /* img */ , url, null, function (errormsg) {
                $scope.showError("Cannot Share. Please try again later!");
            });
        }
        if (type === 'sms') {
            window.plugins.socialsharing.shareViaSMS(url);
        }
        if (type === 'others') {
            $ionicLoading.show();
            window.plugins.socialsharing.share(name, null, null, url, function (success) {
                $ionicLoading.hide();
                if (success == true)
                    $scope.showSuccess('Successfully shared');
            }, function (error) {
                $ionicLoading.hide();
                $scope.showSuccess(error);
            });
        }
    };

    $scope.disconnectFriend = function (f_id, sent_from) {
        Data.send({
            api_key: api_key,
            friend_id: f_id
        }, 'disconnectFriend').then(function (res) {
            if (res.success == 1) {

                $scope.showSuccess('Friend disconnected successfully');

            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };


    $scope.sendFriendRequest = function (id, sent_from) {
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            friend_id: id
        }, 'friendRequestSends').then(function (res) {
            if (res.success == 1) {

                if ($scope.connections != null && $scope.connections != undefined) {
                    angular.forEach($scope.connections, function (value, key) {

                        if (id == $scope.connections[key].id) {
                            $scope.connections[key].f_status = "Request Sent";
                            //console.log('send');
                        }

                    });

                }

                $scope.showSuccess('Request successfully sent');

            } else {}
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.acceptFriendRequest = function (f_id, sent_from) {
        Data.send({
            api_key: api_key,
            s_id: f_id
        }, 'acceptFriendRequest').then(function (res) {
            if (res.success == 1) {


                if ($scope.connections != null && $scope.connections != undefined) {
                    angular.forEach($scope.connections, function (value, key) {

                        if (f_id == $scope.connections[key].id) {
                            $scope.connections[key].f_status = "Disconnect";

                        }

                    });

                }


                $scope.showSuccess('Member request accepted successfully');

            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.rejectFriendRequest = function (f_id, sent_from) {
        Data.send({
            api_key: api_key,
            s_id: f_id
        }, 'rejectFriendRequest').then(function (res) {
            if (res.success == 1) {

                if ($scope.connections != null && $scope.connections != undefined) {
                    angular.forEach($scope.connections, function (value, key) {

                        if (f_id == $scope.connections[key].id) {
                            $scope.connections[key].f_status = "Connect";

                        }

                    });

                }


                $scope.showSuccess('Friend request rejected successfully');



            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.cancelFriendRequest = function (id, sent_from) {
        Data.send({
            api_key: api_key,
            friend_id: id
        }, 'cancelFriendRequest').then(function (res) {
            if (res.success == 1) {


                if ($scope.connections != null && $scope.connections != undefined) {
                    angular.forEach($scope.connections, function (value, key) {

                        if (id == $scope.connections[key].id) {
                            $scope.connections[key].f_status = "Connect";

                        }

                    });

                }



                $scope.showSuccess('Request cancelled');

            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.userDisconnect = function (f_id, sent_from) {
        var confirmDiscon = $ionicPopup.confirm({
            title: 'Are you sure you want to disconnect ?',
            template: ''
        });
        confirmDiscon.then(function (res) {
            if (res) {

                $scope.disconnectFriend(f_id, sent_from);


            } else {}
        });
        $timeout(function () {
            confirmDiscon.close();
        }, 10000);
    };

    function generateRandom(min, max) {
        var num = Math.floor(Math.random() * (max - min + 1)) + min;
        return (num === 8 || num === 15) ? generateRandom(min, max) : num;
    }
    $scope.moreShocialShareAll = function (name, src_url) {
        $ionicLoading.show();

        window.plugins.socialsharing.share(name, null, null, src_url + "?v=1", function (success) {
            $ionicLoading.hide();
            if (success == true)
                $scope.showSuccess('Successfully shared');
        }, function (error) {
            $ionicLoading.hide();
            $scope.showSuccess(error);
        });
    };
    $scope.facebookShareMembers = function (company_name, member_id) {
        var gen_mem_id = company_name + '.' + member_id;
        var url = 'https://www.thebusinessclub.com/profile/' + gen_mem_id;
        window.plugins.socialsharing.shareViaFacebook('para one..', null /* img */ , url, null, function (errormsg) {
            // window.open('https://www.facebook.com/sharer.php?s=100&&p[caption]=dasads&p[url]='.url, '_system');
        });
    };
    $scope.twitterShareMembers = function (company_name, member_id) {
        var gen_mem_id = company_name + '.' + member_id;
        var url = 'https://www.thebusinessclub.com/profile/' + gen_mem_id;
        window.plugins.socialsharing.shareViaTwitter(null, null /* img */ , url, null, function (errormsg) {
            window.open(url, '_system');
        });
    };
    $scope.linkedinShareMembers = function (company_name, member_id) {
        var gen_mem_id = company_name + '.' + member_id;
        var url = 'https://www.thebusinessclub.com/profile/' + gen_mem_id;
        $scope.moreShocialShareAll(company_name, url);
    };
    $scope.whatsappShareMembers = function (company_name, member_id) {
        var gen_mem_id = company_name + '.' + member_id;
        var url = 'https://www.thebusinessclub.com/profile/' + gen_mem_id;
        window.plugins.socialsharing.shareViaWhatsApp(null, null /* img */ , url, null, function (errormsg) {
            $scope.showError("Cannot Share. Please try again later!");
        });
    };
    $scope.sendSMSMembers = function (company_name, member_id, company_name_share) {
        var gen_mem_id = company_name + '.' + member_id;
        var url = 'https://www.thebusinessclub.com/profile/' + gen_mem_id;
        window.plugins.socialsharing.shareViaSMS(url);
    };
    $scope.linkedinShareAds = function (product, name) {
        var random = generateRandom(111111, 999999);
        var gen_pro_id = random + product + random;
        var url = 'https://www.thebusinessclub.com/order/' + gen_pro_id;
        var share_url = 'https://www.linkedin.com/shareArticle?mini=true&url=https://www.thebusinessclub.com/dev366/order/161372193';
        $scope.moreShocialShareAll(name, url);
    };




    ionic.material.ink.displayEffect();
});
app.controller('MessageCtrl', function ($scope, $ionicScrollDelegate, $ionicListDelegate, $timeout, $ionicLoading, Data, TbcAuthService, $rootScope, $ionicModal, $ionicSlideBoxDelegate, $ionicPopup) {
    /** 
     * Message Chat List Controller templates/messaging.html Configurations
     * ===============================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer    : Mohamed Rimsan - rimsnet@gmail.com
     * Controller   : MessageCtrl
     * Main Method  : app.controller('MessageCtrl',function(......){});
     * Reuse Method : -
     * Scope Method : doRefresh(),loadMore(),openNewMessage(),
     *                composeMessage(f,m,s),deleteMessage(m,s),
     *                readMessageChange(i,s_id)
     * Date         : 2017-03-20
     * ===============================================================
     * */
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = false;
    });
    api_key = window.localStorage.getItem('userkey');
    $scope.more = false;

    $scope.msgSearch = '';


    $scope.$on('$ionicView.loaded', function (event, viewData) {});
    var start = 0;
    var count = 10;
    $scope.doRefresh = function () {
        $ionicLoading.show();
        start = 0;
        count = 10;
        Data.send({
            api_key: api_key,
            start: start,
            count: count,
            search: $scope.msgSearch
        }, 'getChatList').then(function (resData) {
            if (resData.message_count > 10)
                $scope.more = true;
            $rootScope.chatlist = resData.chat_list;
            if ($rootScope.activation_active == 2) {
                $scope.more = false;
            }
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
            $ionicScrollDelegate.resize();
        }, function (x) {
            $ionicLoading.hide();
            $scope.showError("Check your connection!");
        });
    };
    $scope.doRefresh();


    $scope.loadMore = function () {
        start = start + 10;
        count = 10;
        Data.send({
            api_key: api_key,
            start: start,
            count: count,
            search: $scope.msgSearch
        }, 'getChatList').then(function (resData) {
            $timeout(function () {
                if ($rootScope.chatlist.length >= resData.message_count) {
                    $scope.more = false;
                } else {
                    $scope.more = true;
                }
                $rootScope.chatlist = $rootScope.chatlist.concat(JSON.parse(JSON.stringify(resData)).chat_list);
                $scope.$broadcast('scroll.infiniteScrollComplete');
            });
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.selectedUsers = [];


    $scope.msgOnSearch = function (msg) {
        $scope.msgSearch = msg;
        //  $scope.doRefresh();
    };


    $scope.checkboxVal = {
        variable: false,
        unique: true
    };
    $scope.check = function () {
        $timeout(function () {
            $scope.$apply();
        });
    };
    $scope.openNewMessage = function () {
        $ionicLoading.show();
        $scope.selectedUsers = [];
        $scope.firstChat = [];
        $scope.secoundChat = [];
        if ($scope.chatlist.length >= 4) {
            for (var i = 0; i < 4; i++) {
                $scope.firstChat.push($scope.chatlist[i]);
                if ($scope.chatlist.length >= 8) {
                    $scope.secoundChat.push($scope.chatlist[4 + i]);
                }
            }
        }
        $ionicModal.fromTemplateUrl('templates/modal/new_message.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalNewMessage = modal;
            $scope.modalNewMessage.show();
            $ionicSlideBoxDelegate.update();
            $ionicLoading.hide();
        });
    };
    $scope.closeNewMessage = function () {
        $scope.modalNewMessage.hide();
    };
    $scope.composeMessage = function (friend, msg_body, msg_sub) {
        if ((msg_sub == null || msg_sub == undefined) && (msg_body == undefined || msg_body == null) && (friend == null || friend == '')) {
            var confirmPopup = $ionicPopup.confirm({
                title: 'You need to type a message',
                buttons: [{
                    text: 'OK',
                    type: 'button-positive',
                    onTap: function (e) {
                        confirmPopup.close();
                    }
                }]
            });
        } else {

            $ionicLoading.show({
                template: '<ion-spinner icon="dots"></ion-spinner><br>Sending...'
            });

            var friend_ids = [];
            angular.forEach(friend, function (value, key) {
                this.push(value['id']);
            }, friend_ids);
            Data.send({
                api_key: api_key,
                friend_id: JSON.stringify(friend_ids),
                msg_body: msg_body,
                msg_sub: msg_sub
            }, 'sendCreateMsg').then(function (resData) {
                $scope.selectedUsers = [];
                $scope.doRefresh();
                $scope.closeNewMessage();
                $ionicLoading.hide();
                $scope.showSuccess('Message has been sent');
            }, function (x) {
                $ionicLoading.hide();
                $scope.showError("Check your connection!");

            });
        }
    };
    $scope.deleteMessage = function (msg_id, send_status) {
        var confirmExitG = $ionicPopup.confirm({
            title: 'Are you sure you want to delete this message ?',
            template: ''
        });
        confirmExitG.then(function (res) {
            if (res) {
                Data.send({
                    api_key: api_key,
                    msg_id: msg_id,
                    send_status: send_status
                }, 'deleteMessage').then(function (resData) {
                    // $rootScope.chatlist.splice($rootScope.chatlist.indexOf('msg_id'), 1);
                    $ionicListDelegate.closeOptionButtons();
                    $scope.doRefresh();
                    $scope.showSuccess('Successfully deleted');
                }, function (x) {
                    $scope.showError("Check your connection!");
                });
            } else {}
        });
    };
    $scope.readMessageChange = function (index, sub_id) {
        angular.forEach($scope.chatlist, function (value, key) {
            if ($scope.chatlist[key].subject_id == sub_id) {
                $scope.chatlist[key].message_unread_bg = "none";
            }
        });
    };

    Data.send({
        api_key: api_key
    }, 'myFriendsListForChat').then(function (res) {
        $scope.userList = res.my_friends;
        $rootScope.friendList = res.my_friends;
        $ionicLoading.hide();
        $scope.$broadcast('scroll.refreshComplete');
    }, function (x) {
        $scope.showError("Check your connection!");
    });


    ionic.material.ink.displayEffect();
});
app.controller('MobtarrifsCtrl', function ($scope, $ionicLoading, Data, TbcAuthService, $ionicPopup) {
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = false;
    });
    api_key = window.localStorage.getItem('userkey');


    $scope.startUp = function () {

        $ionicLoading.show();
        Data.get('mobileTarrifProducts').then(function (resData) {
            $scope.mobileProducts = resData.handset;
            var mobData = [];
            angular.forEach(resData.handset, function (value, key) {
                this.push({
                    id: value['id'],
                    cost_price: value['cost_price'],
                    brand_name: value['brand_name'],
                    image_url: value['image_url'],
                    model_name: value['model_name'],
                    monthly_price: value['monthly_price']
                });
            }, mobData);
            $scope.mobileProducts_tmp = {
                availableOptions: mobData,
                selectedOption: {
                    id: 115
                }
            };
        }, function (x) {
            $scope.showError("Check your connection!");
        });

        Data.send({
            connection_id: 1,
            data: 4,
            product: 115
        }, 'mobileTarrifComparision').then(function (resData) {
            if (resData.success == 1) {
                $scope.enable_mobile_details = true;
                $scope.mobile_details = resData.data;
                $scope.model_data = resData.model_data;
                $scope.model_name = resData.model_name;
                $scope.model_image = resData.model_image;
            } else {
                $scope.enable_mobile_details = false;
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });

        Data.send({
            analog: 0,
            isdn: 1,
            local: 1,
            mobile: 1
        }, 'landlineTarrifComparision').then(function (resData) {
            if (resData.success == 1) {
                $scope.enable_landline_details = true;
                $scope.landline_details = resData.data;
            } else {
                $scope.enable_landline_details = false;
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });

        Data.send({
            data_pack: 24
        }, 'broadbandTarrifComparision').then(function (resData) {
            if (resData.success == 1) {
                $scope.enable_broadband_details = true;
                $scope.broadband_details = resData.data;
            } else {
                $scope.enable_broadband_details = false;
            }
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });

    };

    $scope.startUp();

    $scope.getMobileTarrifComparision = function (selected_connection, selected_gb, selected_product) {
        $ionicLoading.show();
        if (selected_connection) {
            $scope.default_connection = selected_connection;
        }
        if (selected_gb) {
            $scope.default_gb = selected_gb;
        }
        if (selected_product) {
            $scope.default_product = selected_product;
        }
        Data.send({
            connection_id: $scope.default_connection,
            data: $scope.default_gb,
            product: $scope.default_product
        }, 'mobileTarrifComparision').then(function (res) {
            if (res.success == 1) {
                $scope.enable_mobile_details = true;
                $scope.mobile_details = res.data;
                $scope.model_data = res.model_data;
                $scope.model_name = res.model_name;
                $scope.model_image = res.model_image;
                $scope.$broadcast('scroll.refreshComplete');
            } else {
                $scope.enable_mobile_details = false;
            }
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.interestedOnMobileTarrif = function (sup_name, handset, totcon, mobi_data, monthly_cost, term) {
        var confirmExitPost = $ionicPopup.confirm({
            title: 'Send an enquiry?',
            template: ''
        });
        confirmExitPost.then(function (res) {
            if (res) {
                Data.send({
                    api_key: api_key,
                    sup_name: sup_name,
                    handset: handset,
                    totcon: totcon,
                    mobi_data: mobi_data,
                    monthly_cost: monthly_cost,
                    term: term
                }, 'mobileTarrifComparision').then(function (res) {
                    if (res.success == 1) {
                        var alertPopup = $ionicPopup.alert({
                            title: 'Your enquiry has been sent.',
                            template: ''
                        });
                    }
                    $ionicLoading.hide();
                }, function (x) {
                    $scope.showError("Check your connection!");
                });
            } else {}
        });
    };
    $scope.getMobileTarrifComparision = function (selected_connection, selected_gb, selected_product) {
        if (selected_connection) {
            $scope.default_connection = selected_connection;
        }
        if (selected_gb) {
            $scope.default_gb = selected_gb;
        }
        if (selected_product) {
            $scope.default_product = selected_product;
        }
        $ionicLoading.show();
        Data.send({
            connection_id: $scope.default_connection,
            data: $scope.default_gb,
            product: $scope.default_product
        }, 'mobileTarrifComparision').then(function (res) {
            if (res.success == 1) {
                $scope.enable_mobile_details = true;
                $scope.mobile_details = res.data;
                $scope.model_data = res.model_data;
                $scope.model_name = res.model_name;
                $scope.model_image = res.model_image;
            } else {
                $scope.enable_mobile_details = false;
            }
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.interestedOnMobileTarrif = function (sup_name, handset, totcon, mobi_data, monthly_cost, term) {
        var confirmExitPost = $ionicPopup.confirm({
            title: 'Send an enquiry?',
            template: ''
        });
        confirmExitPost.then(function (res) {
            if (res) {
                Data.send({
                    api_key: api_key,
                    sup_name: sup_name,
                    handset: handset,
                    totcon: totcon,
                    mobi_data: mobi_data,
                    monthly_cost: monthly_cost,
                    term: term
                }, 'mobileTarrifComparision').then(function (res) {
                    if (res.success == 1) {
                        var alertPopup = $ionicPopup.alert({
                            title: 'Your enquiry has been sent.',
                            template: ''
                        });
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                    $ionicLoading.hide();
                }, function (x) {
                    $scope.showError("Check your connection!");
                });
            } else {}
        });
    };
    $scope.getLandlineTarrifComparision = function (selected_lines, selected_lines_needed) {
        //console.log('selected_lines ' + selected_lines + ' selected_lines_needed ' + selected_lines_needed);




        if (selected_lines != undefined) {
            $scope.default_lines = selected_lines;
        }
        if (selected_lines_needed != undefined) {
            $scope.default_lines_needed = selected_lines_needed;
        }
        Data.send({
            analog: $scope.default_lines,
            isdn: $scope.default_lines_needed,
            local: 1,
            mobile: 1
        }, 'landlineTarrifComparision').then(function (res) {
            if (res.success == 1) {
                $scope.enable_landline_details = true;
                $scope.landline_details = res.data;

            } else {
                $scope.enable_landline_details = false;
            }

            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });


    };
    $scope.interestedOnLandlineTarrif = function (company_name, no_oflines, voip_con) {
        var confirmExitPost = $ionicPopup.confirm({
            title: 'Send an enquiry?',
            template: ''
        });
        confirmExitPost.then(function (res) {
            if (res) {
                Data.send({
                    api_key: api_key,
                    company_name: company_name,
                    no_oflines: no_oflines,
                    voip_con: voip_con
                }, 'sendLandlineTarrifComparision').then(function (res) {
                    if (res.success == 1) {
                        var alertPopup = $ionicPopup.alert({
                            title: 'Your enquiry has been sent.',
                            template: ''
                        });
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                    $ionicLoading.hide();
                }, function (x) {
                    $scope.showError("Check your connection!");
                });
            } else {}
        });
    };
    $scope.getBroadbandTarrifComparision = function (selected_speed) {
        if (selected_speed) {
            $scope.default_speed = selected_speed;
        }
        Data.send({
            data_pack: $scope.default_speed
        }, 'broadbandTarrifComparision').then(function (res) {
            if (res.success == 1) {
                $scope.enable_broadband_details = true;
                $scope.broadband_details = res.data;
            } else {
                $scope.enable_broadband_details = false;
            }
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.interestedOnBroadbandTarrif = function (company_name, data_pack) {
        var confirmExitPost = $ionicPopup.confirm({
            title: 'Send an enquiry?',
            template: ''
        });
        confirmExitPost.then(function (res) {
            if (res) {
                Data.send({
                    api_key: api_key,
                    company_name: company_name,
                    data_pack: data_pack
                }, 'sendBroadbandTarrifComparision').then(function (res) {
                    if (res.success == 1) {
                        var alertPopup = $ionicPopup.alert({
                            title: 'Your enquiry has been sent.',
                            template: ''
                        });
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                    $ionicLoading.hide();
                }, function (x) {
                    $scope.showError("Check your connection!");
                });
            } else {}
        });
    }
    $scope.tmpArray = [];
    for (var i = 1; i <= 50; i++) {
        $scope.tmpArray.push({
            id: i,
            name: i
        });
    }
    $scope.num_of_connections = {
        availableOptions: $scope.tmpArray,
        selectedOption: {
            id: $scope.default_connection,
            name: $scope.default_connection
        }
    };
    $scope.num_of_gb = {
        availableOptions: [{
            id: 1,
            name: 1
        }, {
            id: 2,
            name: 2
        }, {
            id: 3,
            name: 3
        }, {
            id: 4,
            name: 4
        }, {
            id: 7,
            name: 7
        }, {
            id: 8,
            name: 8
        }, {
            id: 10,
            name: 10
        }, {
            id: 12,
            name: 12
        }, {
            id: 16,
            name: 16
        }, {
            id: 20,
            name: 20
        }, {
            id: 32,
            name: 32
        }, {
            id: 64,
            name: 64
        }],
        selectedOption: {
            id: $scope.default_gb,
            name: $scope.default_gb
        }
    };
    $scope.var4 = 1;
    $scope.TariffNavigation = function (num) {
        $scope.var4 = num;
        if (num == 1) {
            $scope.tmpArray = [];
            for (var i = 1; i <= 50; i++) {
                $scope.tmpArray.push({
                    id: i,
                    name: i
                });
            }
            $scope.num_of_connections = {
                availableOptions: $scope.tmpArray,
                selectedOption: {
                    id: $scope.default_connection,
                    name: $scope.default_connection
                }
            };
            $scope.num_of_gb = {
                availableOptions: [{
                    id: 1,
                    name: 1
                }, {
                    id: 2,
                    name: 2
                }, {
                    id: 3,
                    name: 3
                }, {
                    id: 4,
                    name: 4
                }, {
                    id: 7,
                    name: 7
                }, {
                    id: 8,
                    name: 8
                }, {
                    id: 10,
                    name: 10
                }, {
                    id: 12,
                    name: 12
                }, {
                    id: 16,
                    name: 16
                }, {
                    id: 20,
                    name: 20
                }, {
                    id: 32,
                    name: 32
                }, {
                    id: 64,
                    name: 64
                }],
                selectedOption: {
                    id: $scope.default_gb,
                    name: $scope.default_gb
                }
            };
            $scope.mobileProducts;
        } else if (num == 2) {
            $scope.tmpterr = [];
            $scope.tmpnee = [];
            for (var i = 0; i <= 20; i++)
                $scope.tmpterr.push({
                    id: i,
                    name: i
                });
            $scope.num_of_lines = {
                availableOptions: $scope.tmpterr,
                selectedOption: {
                    id: $scope.default_lines,
                    name: $scope.default_lines
                }
            };
            for (var i = 0; i <= 20; i++)
                $scope.tmpnee.push({
                    id: i,
                    name: i
                });
            $scope.num_of_lines_needed = {
                availableOptions: $scope.tmpnee,
                selectedOption: {
                    id: $scope.default_lines_needed,
                    name: $scope.default_lines_needed
                }
            };
        } else if (num == 3) {
            $scope.download_speed = {
                availableOptions: [{
                    id: 24,
                    name: 24
                }, {
                    id: 40,
                    name: 40
                }, {
                    id: 80,
                    name: 80
                }],
                selectedOption: {
                    id: $scope.default_speed,
                    name: $scope.default_speed
                }
            };
        }
    }
    /* tarrifs popups 
     ==================*/
    $scope.mobileTarrifOne = function () {
        var alertPopup = $ionicPopup.alert({
            template: 'Choose how many business mobiles you need',
            cssClass: 'my-custom-popup',
            buttons: [{
                text: 'Ok',
                type: 'button-calm button-small'
            }]
        });
    };
    $scope.mobileTarrifTwo = function () {
        var alertPopup = $ionicPopup.alert({
            template: '<b> IMPORTANT! </b> Choose enough Data to suit your usage to avoid incurring out of bundle charges!',
            cssClass: 'my-custom-popup',
            buttons: [{
                text: 'Ok',
                type: 'button-calm button-small'
            }]
        });
    };
    $scope.mobileTarrifThree = function () {
        var alertPopup = $ionicPopup.alert({
            template: 'Choose from the cheapest business SIM Only or how about a rugged Samsung Xcover 3 or the latest iPhone 7?',
            cssClass: 'my-custom-popup',
            buttons: [{
                text: 'Ok',
                type: 'button-calm button-small'
            }]
        });
    };
    $scope.mobileTarrifFour = function () {
        var alertPopup = $ionicPopup.alert({
            template: 'O2, Vodafone or EE business users can transfer to our airtime if eligible to upgrade or are out of contract.',
            cssClass: 'my-custom-popup',
            buttons: [{
                text: 'Ok',
                type: 'button-calm button-small'
            }]
        });
    };
    $scope.mobileTarrifFive = function () {
        var alertPopup = $ionicPopup.alert({
            template: 'All of the business tariffs you have compared include unlimited landline minutes to 01, 02 and 03 numbers |Unlimited minutes to Mobiles connected to O2, Vodafone, EE and Three | unlimited texts to the O2, Vodafone, EE and Three business networks',
            cssClass: 'my-custom-popup',
            buttons: [{
                text: 'Ok',
                type: 'button-calm button-small'
            }]
        });
    };
    $scope.mobileTarrifSix = function () {
        var alertPopup = $ionicPopup.alert({
            template: 'How many Analogue lines do you need? Each line comes with; <br><br> Unlimited landline calls to 01,02 and 03 numbers | Unlimited calls to O2, Vodafone, EE and Three business mobile networks <br><br> <b>AMAZING VALUE!</b>',
            cssClass: 'my-custom-popup',
            buttons: [{
                text: 'Ok',
                type: 'button-calm button-small'
            }]
        });
    };
    $scope.mobileTarrifSeven = function () {
        var alertPopup = $ionicPopup.alert({
            template: 'Landline as you know it with your calls routing out through broadband. <br><br> Unlimited landline calls to 01,02 and 03 numbers | Unlimited calls to O2, Vodafone, EE and Three business mobile networks <br><br> Unlimited calls to USA, Canada, China, France, Germany, Spain, Ireland, Portugal and Netherlands. <br><br> Includes voicemail <br><br> <b>FREE DESKPHONE</b>',
            cssClass: 'my-custom-popup',
            buttons: [{
                text: 'Ok',
                type: 'button-calm button-small'
            }]
        });
    };
    $scope.mobileTarrifEigth = function () {
        var alertPopup = $ionicPopup.alert({
            template: 'All of the business landline tariffs include unlimited landline minutes to 01 02 and 03 numbers |unlimited minutes to Mobiles connected to O2, Vodafone, EE and Three subject to fair usage policy',
            cssClass: 'my-custom-popup',
            buttons: [{
                text: 'Ok',
                type: 'button-calm button-small'
            }]
        });
    };
    $scope.mobileTarrifNine = function () {
        var alertPopup = $ionicPopup.alert({
            template: 'MB speeds are upto speeds | A quick postcode check will be required to check speed at your location[s]',
            cssClass: 'my-custom-popup',
            buttons: [{
                text: 'Ok',
                type: 'button-calm button-small'
            }]
        });
    };
    /* end tarrifs popups 
     ==================*/
    ionic.material.ink.displayEffect();
});
app.controller('NotificationCtrl', function ($scope, $rootScope, $ionicLoading, TbcAuthService, Data, $ionicScrollDelegate, $state) {
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = false;
    });
    $ionicLoading.show();
    api_key = window.localStorage.getItem('userkey');
    var start = 0,
        count = 10;
    $scope.doRefresh = function () {
        start = 0;
        count = 10;
        var datas = {
            api_key: api_key,
            start: start,
            count: count
        };
        Data.send(datas, 'userNotification').then(function (resData) {

            if ($rootScope.activation_active == 1) {
                $scope.notifications = resData.notifications;
                if (resData.notifications_count > 10) {
                    $scope.more = true;
                }
            } else {
                $scope.notifications = resData.notifications;
                $scope.more = false;
            }
            $scope.notifications_count = resData.notifications_count;
            $ionicLoading.hide();
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.notificationClass = function (index) {
        $scope.notifications[index].api_notification_view = "";
    };
    $scope.doRefresh();
    $scope.loadMore = function () {

        start = start + 10;
        count = start + 10;

        var datas = {
            api_key: api_key,
            start: start,
            count: count
        };
        Data.send(datas, 'userNotification').then(function (resData) {

            if ($scope.notifications.length >= resData.notifications_count - 1) {
                $scope.more = false;
            }
            $scope.notifications = $scope.notifications.concat(JSON.parse(JSON.stringify(resData)).notifications);
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    ionic.material.ink.displayEffect();
});
app.controller('AdsProductCtrl', function ($scope, $cordovaFileTransfer, $ionicLoading, Data, TBC, TbcAuthService, $ionicScrollDelegate, $ionicModal, $filter, $ionicActionSheet, $ionicPopup, $timeout, $state) {
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = false;
    });
    api_key = window.localStorage.getItem('userkey');
    var images = [];
    $scope.serverImage = [];
    var loadSize = 0;
    $scope.img = images;
    var incre = 0;
    $scope.county = "All";
    $scope.town_id = "All";
    $scope.cat_id = "All";
    $scope.sub_cat_id = "All";
    $scope.var2 = 1;

    $scope.adSearch = '';


    $scope.getAdSearch = function (search, var2) {

        $scope.adSearch = search;

        if (var2 == 1) {
            $scope.getMyProduct();
        }

        if (var2 == 2) {
            $scope.getMyExpiredProducts();
        }

        if (var2 == 3) {
            $scope.getProduct();
        }


    };

    $scope.AdsNavigation = function (num) {
        $scope.var2 = num;
        if (num == 3) {
            $scope.county = "All";
            $scope.town_id = "All";
            $scope.cat_id = "All";
            $scope.sub_cat_id = "All";
        }
    };
    $scope.getProduct = function () {
        $scope.products = [];
        $scope.county = "All";
        $scope.town_id = "All";
        $scope.cat_id = "All";
        $scope.sub_cat_id = "All";
        $scope.all_ads_start = 0;
        $scope.all_ads_limit = 10;
        //$scope.adSearch='';
        Data.send({
            api_key: api_key,
            start: $scope.all_ads_start,
            count: $scope.all_ads_limit,
            county: 'All',
            town: 'All',
            category: 'All',
            sub_category: 'All',
            search: $scope.adSearch
        }, 'adsearch').then(function (resData) {
            $scope.products = JSON.parse(JSON.stringify(resData)).products;
            if (JSON.parse(JSON.stringify(resData)).products_count > 10) {
                $scope.all_ads_start = 10;
                $scope.all_ads_limit = 10;
                $scope.productsMore = false;
            } else {
                $scope.productsMore = true;
            }
            $scope.products_count = JSON.parse(JSON.stringify(resData)).products_count;
            $ionicLoading.hide();
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    var myex_start = 0,
        myex_count = 10;
    $scope.myexMore = false;

    $scope.getMyExpiredProducts = function () {
        myex_start = 0;
        myex_count = 10;
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            start: myex_start,
            count: myex_count,
            search: $scope.adSearch
        }, 'expairyAds').then(function (resData) {
            if (JSON.parse(JSON.stringify(resData)).expired_count > 0) {
                $scope.have_products = true;
                $scope.havee_products = true;

                $scope.expired_deals = JSON.parse(JSON.stringify(resData)).expired_deals;

                if (resData.expired_count > 10) {
                    $scope.myexMore = true;
                }

            } else {
                $scope.have_products = false;
                $scope.havee_products = false;
                $scope.expired_count = 0;
                $scope.expired_deals = [];
            }
            $ionicLoading.hide();
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };


    $scope.getMyExpiredProductsMore = function () {
        myex_start = myex_start + myex_count;
        myex_count = 10;
        //$ionicLoading.show();
        Data.send({
            api_key: api_key,
            start: myex_start,
            count: myex_count,
            search: $scope.adSearch
        }, 'expairyAds').then(function (resData) {
            if (JSON.parse(JSON.stringify(resData)).expired_count > 0) {
                $scope.have_products = true;
                $scope.havee_products = true;

                $scope.expired_deals = $scope.expired_deals.concat(JSON.parse(JSON.stringify(resData)).expired_deals);
                if ($scope.expired_deals.length >= resData.expired_count) {
                    $scope.myexMore = false;
                } else {
                    $scope.myexMore = true;
                }

            } else {
                //$scope.have_products = false;
                //$scope.havee_products = false;
                // $scope.expired_count = 0;
                // $scope.expired_deals = [];
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };



    var mypro_start = 0,
        mypro_limit = 10;
    $scope.mypro_more = false;
    $scope.getMyProduct = function () {
        mypro_start = 0, mypro_limit = 10;
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            start: mypro_start,
            count: mypro_limit,
            search: $scope.adSearch
        }, 'userdeals').then(function (res) {
            if (JSON.parse(JSON.stringify(res)).success > 0) {
                $scope.my_deals = JSON.parse(JSON.stringify(res)).my_deals;
                $scope.have_products = true;
                if (res.my_deals_count > 10) {
                    $scope.mypro_more = true;
                }
            } else {
                $scope.have_products = false;
                $scope.my_deals = [];
                $scope.mypro_more = false;
            }
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.getMyProductMore = function () {
        mypro_start = mypro_start + 10, mypro_limit = 10;
        Data.send({
            api_key: api_key,
            start: mypro_start,
            count: mypro_limit,
            search: $scope.adSearch
        }, 'userdeals').then(function (res) {
            if (JSON.parse(JSON.stringify(res)).success > 0) {
                $scope.my_deals = $scope.my_deals.concat(JSON.parse(JSON.stringify(res)).my_deals);
                if ($scope.my_deals.length >= res.my_deals_count) {
                    $scope.mypro_more = false;
                } else {
                    $scope.mypro_more = true;
                }
            } else {
                $scope.have_products = false;
                $scope.my_deals = [];
                $scope.mypro_more = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.getMyProduct();
    $scope.getMyExpiredProducts();
    $scope.getProduct();

    $scope.adsRefresh = function (var2) {
        if (var2 == 1) {
            $scope.getMyProduct();
        }
        if (var2 == 2) {
            $scope.getMyExpiredProducts();
        }
        if (var2 == 3) {
            $scope.getProduct();
        }
    };


    if (api_key == null) {
        $scope.var2 = 3;
        $scope.adsRefresh(3);
    } else {
        $scope.var2 = 1;
    }

    $scope.goToAllAds = function () {
        $scope.county = "All";
        $scope.town_id = "All";
        $scope.cat_id = "All";
        $scope.sub_cat_id = "All";
    };
    $scope.loadMoreSearchProducts = function (county, town_id, cat_id, sub_cat_id) {
        Data.send({
            start: $scope.all_ads_start,
            count: $scope.all_ads_limit,
            county: county,
            town: town_id,
            category: cat_id,
            sub_category: sub_cat_id,
            search: $scope.adSearch
        }, 'adsearch').then(function (res) {
            $scope.len = JSON.parse(JSON.stringify(res)).products;
            if (county == "All" && town_id == "All" && cat_id == "All" && sub_cat_id == "All") {
                $scope.products = $scope.products.concat(JSON.parse(JSON.stringify(res)).products);
                $scope.products_count = JSON.parse(JSON.stringify(res)).products_count;
            } else if (county != "All" || town_id != "All" || cat_id != "All" || sub_cat_id != "All") {
                $scope.search_products = $scope.search_products.concat(JSON.parse(JSON.stringify(res)).products);
                $scope.search_products_count = JSON.parse(JSON.stringify(res)).products_count;
            }
            $scope.all_ads_start = $scope.all_ads_start + 10;
            $scope.all_ads_limit = 10;
            if ($scope.products.length > JSON.parse(JSON.stringify(res)).products_count) {
                $scope.productsMore = true;
            } else {
                $scope.productsMore = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.openFilter = function () {
        $ionicLoading.show();
        $ionicModal.fromTemplateUrl('templates/modal/filter_ads.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            Data.send({
                api_key: api_key,
                start: 0,
                count: 10
            }, 'getCounties').then(function (res) {
                $scope.counties = JSON.parse(JSON.stringify(res)).counties;
                if (JSON.parse(JSON.stringify(res)).counties.length <= 0) {
                    $scope.enable_town = false;
                } else {
                    $scope.enable_town = true;
                }
                Data.get('getCategoryTableList').then(function (res) {
                    $scope.category_groups = JSON.parse(JSON.stringify(res)).category;

                    //console.log($scope.category_groups);

                    $scope.modalFilter = modal;
                    $scope.modalFilter.show();
                    $ionicLoading.hide();
                }, function (x) {
                    $scope.showError("Check your connection!");
                });
            }, function (x) {
                $scope.showError("Check your connection!");
            });
        });
    };
    $scope.closeFilter = function () {
        $scope.modalFilter.hide();
    };
    $scope.getTown = function (county) {
        Data.send({
            county_id: county
        }, 'getTowns').then(function (res) {
            $scope.towns = JSON.parse(JSON.stringify(res)).towns;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.FilterAds = function (location, cat_id, sub_cat_id) {
        $ionicLoading.show();
        $scope.all_ads_start = 0;
        $scope.all_ads_limit = 10;
        if (location) {
            if (location.county_id) {
                $county_name = location.county_id;
                $scope.county = location.county_id;
            } else {
                $county_name = "All";
                $scope.county = "All";
            }
            if (location.town_id) {
                $town_id = location.town_id;
                $scope.town_id = location.town_id;
            } else {
                $town_id = "All";
                $scope.town_id = "All";
            }
        } else {
            $county_name = "All";
            $town_id = "All";
            $scope.county = "All";
            $scope.town_id = "All";
        }
        if ($county_name == "All") {
            $town_id = "All";
            $scope.town_id = "All";
        }
        if (cat_id) {
            $category_id = cat_id;
            $scope.cat_id = cat_id;
        } else {
            $category_id = "All";
            $scope.cat_id = "All";
        }
        if (sub_cat_id) {
            $sub_category_id = sub_cat_id;
            $scope.sub_cat_id = sub_cat_id;
        } else {
            $sub_category_id = "All";
            $scope.sub_cat_id = "All";
        }
        $scope.noMoreProductsAvailable = false;
        Data.send({
            start: $scope.all_ads_start,
            count: $scope.all_ads_limit,
            county: $county_name,
            town: $town_id,
            category: $category_id,
            sub_category: $sub_category_id
        }, 'adsearch').then(function (res) {
            if (JSON.parse(JSON.stringify(res)).products_count > 10) {
                $scope.productsMore = false;
                $scope.all_ads_start = 10;
                $scope.all_ads_limit = 10;
            } else {
                $scope.productsMore = true;
            }
            $ionicLoading.hide();
            $scope.closeFilter();
            $scope.search_products = JSON.parse(JSON.stringify(res)).products;
            $scope.search_products_count = JSON.parse(JSON.stringify(res)).products_count;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.openNewAd = function (product_id) {
        $scope.product = {};
        $scope.productImages = [];
        if (product_id >= 1) {
            $scope.getProductView(product_id, "1?edit=yes");
            $scope.opennewAdForm();
        } else {
            $scope.productImages = [];
            $scope.product.discounted_price = 0;
            $scope.todayDate = $filter('date')(new Date(), 'dd-MM-yyyy');
            $scope.getCategories();
            $scope.opennewAdForm();
        }
    };
    $scope.getSubCategory = function (cat_id) {
        $ionicLoading.show();
        Data.send({
            category_id: cat_id
        }, 'getSubCategoriesByCatID').then(function (res) {
            $scope.sub_categories = JSON.parse(JSON.stringify(res)).sub_categories;
            if (JSON.parse(JSON.stringify(res)).sub_categories.length <= 0) {
                $scope.enable_subcat = false;
                $scope.enable_brand = false;
            } else {
                $scope.enable_subcat = true;
                $scope.enable_brand = false;
            }
            $scope.brands = [];
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.getBrands = function (cat_id) {
        $ionicLoading.show();
        Data.send({
            category_id: cat_id
        }, 'getBrandsBySubCatID').then(function (res) {
            $scope.brands = JSON.parse(JSON.stringify(res)).brands;
            if (JSON.parse(JSON.stringify(res)).brands.length <= 0) {
                $scope.enable_brand = false;
            } else {
                $scope.enable_brand = true;
            }
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.calculateDiscount = function (dis_rate, basic_price) {
        var discount = dis_rate;
        var price = basic_price;
        var dis_price = (parseInt(price) * discount) / 100;
        var discounted_price = parseFloat(price - dis_price);
        $scope.product.discounted_price = (discounted_price <= 0) ? 0 : discounted_price;
    };
    $scope.getProductView = function (id, category) {
        //console.log(id);
        $ionicLoading.show();
        Data.get('order/' + id + '/' + category).then(function (res) {
            $scope.product = {};
            $scope.product = res.product;
            $scope.product.expiry_date = $filter('date')(new Date(res.product.expiry_date), 'dd-MM-yyyy');
            $scope.productImages = [];
            $scope.productImages = res.product.images;
            $scope.image_location_post = res.product.image_location;
            $scope.categories = res.categories;
            $scope.todayDate = $filter('date')(new Date(res.product.expiry_date), 'dd-MM-yyyy');
            if ($scope.productImages) {
                $scope.num_of_images = 5 - $scope.productImages.length;
            }
            $scope.date = $filter("date")(Date.now(), 'yyyy-MM-dd');
            $scope.calculateDiscount(res.product.discount_price_num, res.product.basic_price);
            if (res.sub_categories) {
                if (res.sub_categories.length > 0) {
                    $scope.sub_categories = res.sub_categories;
                    $scope.enable_subcat = true;
                }
            }
            if ($scope.product.sub_category_id != null) {
                $scope.enable_subcat = true;
                $scope.sub_categories = $scope.getSubCategory($scope.product.main_cat_id);
            }
            if ($scope.product.product_brand != null) {
                $scope.enable_brand = true;
                $scope.brands = $scope.getBrands($scope.product.sub_category_id);
            }
            if (res.brands) {
                if (res.brands.length > 0) {
                    $scope.enable_brand = true;
                    $scope.brands = res.brands;
                }
            }
            $ionicLoading.hide();
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.opennewAdForm = function () {
        $ionicModal.fromTemplateUrl('templates/modal/new_ad.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalNewAd = modal;
            $scope.modalNewAd.show();
        });
    };
    $scope.closeNewAd = function () {
        $scope.product = null;
        $scope.modalNewAd.hide();
        $scope.productImages = [];
    };
    $scope.getCategories = function () {
        Data.send({}, 'getCategories').then(function (res) {
            $scope.categories = JSON.parse(JSON.stringify(res)).categories;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.showAdAction = function (product_id) {
        var pro = product_id;
        $scope.enable_subcat = false;
        $scope.tmpProId = product_id;
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Edit'
            }, {
                text: '<span class="text-red"> Delete </span>'
            }],
            titleText: 'Ads Option',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    $scope.openNewAd(pro);
                } else if (index == 1) {
                    $scope.deleteProduct(pro);
                }
                return true;
            }
        });
    };
    $scope.deleteProduct = function (id) {
        var confirmPdel = $ionicPopup.confirm({
            title: 'Are you sure you want to delete this product?',
            template: ''
        });
        confirmPdel.then(function (res) {
            if (res) {
                $scope.confirmDeleteProduct(id, 1);
            } else {}
        });
        $timeout(function () {
            confirmPdel.close();
        }, 10000);
    };
    $scope.confirmDeleteProduct = function (id, password) {
        Data.send({
            api_key: api_key,
            product_id: id,
            password: password
        }, 'deleteproduct').then(function (res) {
            if ($scope.my_deals != null) {
                angular.forEach($scope.my_deals, function (value, key) {
                    if (id == $scope.my_deals[key].id) {
                        $scope.my_deals.splice(key, 1);
                    }
                });
            }
            $scope.getMyProduct();
            $scope.getMyExpiredProducts();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.addProduct = function (productDetails) {

        // if (ionic.Platform.isIOS()) {
        productDetails.expiry_date = $filter('date')(productDetails.expiry_date, "yyyy-MM-dd");
        // }

        var messgePop = '';
        if (productDetails.main_cat_id == undefined || productDetails.main_cat_id == -1 || productDetails.product_small_description == '' || productDetails.product_small_description == undefined || productDetails.product_name == undefined || productDetails.product_name == '') {
            if (productDetails.product_small_description == '' || productDetails.product_small_description == undefined) {
                messgePop = "Product Description should be added";
                if (productDetails.product_small_description == '.') {
                    messgePop = "Product Description should be added and '.' value not allowed";
                }
            } else if ((productDetails.main_cat_id == undefined || productDetails.main_cat_id == -1) && (productDetails.product_small_description == '' || productDetails.product_small_description == undefined)) {
                messgePop = "Product Description and Category should be added";
            } else if (productDetails.main_cat_id == undefined || productDetails.main_cat_id == -1) {
                messgePop = "Category should be selected";
            } else if (productDetails.product_name == '' || productDetails.product_name == undefined) {
                messgePop = "Name field should be field";
            } else if ((productDetails.main_cat_id == undefined || productDetails.main_cat_id == -1) && (productDetails.product_small_description == '' || productDetails.product_small_description == undefined) && (productDetails.product_name == '' || productDetails.product_name == undefined)) {
                messgePop = "Product Description, Name field and Category should be added";
            }
            $scope.showError(messgePop, 2000);
        } else {
            if (productDetails['images']) {
                $check_image = 'have image';
            } else {
                $check_image = 'no image';
            }
            if ($scope.img == "") {
                $upload_image = 'no image';
            } else {
                $upload_image = 'have image';
            }
            if ($upload_image == "have image" || $check_image == "have image") {
                if ($upload_image == "have image" && $check_image == "have image") {
                    $scope.uploadPics('product', productDetails, api_key);
                } else if ($upload_image == "have image") {
                    $scope.uploadPics('product', productDetails, api_key);
                } else if ($check_image == "have image") {
                    var file_ids = [];
                    angular.forEach($scope.productImages, function (value, key) {
                        this.push(value['id']);
                    }, file_ids);
                    Data.send({
                        api_key: api_key,
                        product_names: productDetails.product_name,
                        prices: productDetails.basic_price,
                        tbl_category_id_ad: productDetails.main_cat_id,
                        tbl_sub_category_idad: productDetails.sub_category_id,
                        discount: productDetails.discount_price_num,
                        expiry_date: productDetails.expiry_date,
                        pro_sml_descs: productDetails.product_small_description,
                        pro_descs: productDetails.product_description,
                        product_brands: productDetails.product_brand,
                        id: productDetails.product_id,
                        image_ids: file_ids
                    }, 'addProduct').then(function (res) {
                        $scope.showSuccess('Successfully completed', 2000);
                        $scope.closeNewAd();
                        $scope.getMyProduct();
                        $scope.getMyExpiredProducts();
                        $scope.getProduct();
                    }, function (x) {
                        $scope.showError("Check your connection!");
                    });
                    $scope.showSuccess('Successfully completed', 2000);
                }
            } else if ($upload_image == "no image" && $check_image == "no image") {
                Data.send({
                    api_key: api_key,
                    product_names: productDetails.product_name,
                    prices: productDetails.basic_price,
                    tbl_category_id_ad: productDetails.main_cat_id,
                    tbl_sub_category_idad: productDetails.sub_category_id,
                    discount: productDetails.discount_price_num,
                    expiry_date: productDetails.expiry_date,
                    pro_sml_descs: productDetails.product_small_description,
                    pro_descs: productDetails.product_description,
                    product_brands: productDetails.product_brand,
                    id: productDetails.product_id,
                    image_ids: ''
                }, 'addProduct').then(function (res) {
                    $scope.closeNewAd();
                    $scope.getMyProduct();
                    $scope.getMyExpiredProducts();
                    $scope.getProduct();
                }, function (x) {
                    $scope.showError("Check your connection!");
                });
                $scope.showSuccess('Successfully completed', 2000);
            }
        }
    };

    function addProduct(details, api_key_manual, imgIds) {
        var re = false;
        var datas = {
            api_key: api_key_manual,
            product_names: details.product_name,
            prices: details.basic_price,
            tbl_category_id_ad: details.main_cat_id,
            tbl_sub_category_idad: details.sub_category_id,
            discount: details.discount_price_num,
            expiry_date: details.expiry_date,
            pro_sml_descs: details.product_small_description,
            pro_descs: details.product_description,
            product_brands: details.product_brand,
            id: details.product_id,
            image_ids: imgIds
        };
        Data.send(datas, 'addProduct').then(function (res) {
            re = true;
            return true;
        }, function (x) {
            re = false;
            return false;
            $scope.showError("Check your connection!");
        });
        return re;
    }
    $scope.uploadPics = function (img_type, productDetails, api_key) {
        $ionicLoading.show();
        var file_ids = [];
        angular.forEach($scope.productImages, function (value, key) {
            this.push(value['id']);
        }, file_ids);
        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            images.forEach(function (i) {
                var options = new FileUploadOptions();
                options.fileKey = "uploadfile";
                options.fileName = i.substr(i.lastIndexOf('/') + 1);
                options.mimeType = "image/jpeg";
                var params = new Object();
                params.api_key = api_key;
                params.src = img_type;
                options.params = params;
                options.chunkedMode = false;
                $cordovaFileTransfer.upload(encodeURI(TBC.URL + 'imageUploadToServer'), i, options).then(function (r) {
                    var str = r.response;
                    var d = str.trim();
                    var obj = JSON.parse(d);
                    $scope.serverImage.push(obj);
                    incre++;
                    if (incre == images.length) {
                        angular.forEach($scope.serverImage, function (value, key) {
                            this.push(value['file_id']);
                        }, file_ids);
                        Data.send({
                            api_key: api_key,
                            product_names: productDetails.product_name,
                            prices: productDetails.basic_price,
                            tbl_category_id_ad: productDetails.main_cat_id,
                            tbl_sub_category_idad: productDetails.sub_category_id,
                            discount: productDetails.discount_price_num,
                            expiry_date: productDetails.expiry_date,
                            pro_sml_descs: productDetails.product_small_description,
                            pro_descs: productDetails.product_description,
                            product_brands: productDetails.product_brand,
                            id: productDetails.product_id,
                            image_ids: file_ids
                        }, 'addProduct').then(function (res) {
                            file_ids = [];
                            images = [];
                            $scope.serverImage = [];
                            loadSize = 0;
                            $scope.img = images;
                            incre = 0;
                            $ionicLoading.hide();
                            $scope.showSuccess('Success');
                            $scope.closeNewAd();
                            $scope.getMyProduct();
                            $scope.getMyExpiredProducts();
                            $scope.getProduct();
                        }, function (x) {
                            $scope.showError("Check your connection!");
                        });
                    }
                }, function (err) {}, function (progress) {
                    if (progress.lengthComputable) {} else {}
                });
            });
        }
    };
    $scope.removeSelectedImage = function (item, product_id) {
        var index = $scope.productImages.indexOf(item);
        $scope.productImages.splice(index, 1);
    };
    $scope.removeUploadImage = function (item) {
        var index = $scope.img.indexOf(item);
        $scope.img.splice(index, 1);
    };
    $scope.selectImages = function (num, img_type) {
        TbcAuthService.getFileUploadPermission();
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Load from Library'
            }, {
                text: 'Use Camera'
            }],
            titleText: 'Select Image',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    document.addEventListener("deviceready", onDeviceReady, false);

                    function onDeviceReady() {
                        window.imagePicker.getPictures(function (results) {
                            for (var i = 0; i < results.length; i++) {

                                if (ionic.Platform.isAndroid()) {
                                    images.push(results[i]);
                                }else{
                                    images.push(window.Ionic.normalizeURL(results[i]));

                                }
                                $state.reload();

                            }
                        }, function (error) {
                            alert('Error: ' + error);
                        }, {
                            maximumImagesCount: num,
                            quality: 60
                        });
                    }
                } else if (index == 1) {
                    document.addEventListener("deviceready", onDeviceReady, false);

                    function onDeviceReady() {
                        var cameraOptions = {
                            quality: 60,
                            destinationType: Camera.DestinationType.FILE_URI,
                            encodingType: Camera.EncodingType.JPEG,
                            mediaType: Camera.MediaType.PICTURE,
                            allowEdit: true
                        };
                        navigator.camera.getPicture(function (success) {
                            if (ionic.Platform.isAndroid()) {
                                images.push(success);
                            }else{
                                images.push(success);

                            }
                            $state.reload();

                        }, function (error) {
                            // $scope.showError('Check your camera option');
                        }, cameraOptions);
                    }
                }
                return true;
            }
        });
    };
    $scope.moreShocialShareAll = function (name, src_url, img) {
        $ionicLoading.show();
        window.plugins.socialsharing.share(name, null, null, src_url, function (success) {
            $ionicLoading.hide();
            if (success == true)
                $scope.showSuccess('Successfully shared');
        }, function (error) {
            $ionicLoading.hide();
            $scope.showSuccess(error);
        });
    };

    function generateRandom(min, max) {
        var num = Math.floor(Math.random() * (max - min + 1)) + min;
        return (num === 8 || num === 15) ? generateRandom(min, max) : num;
    }
    $scope.facebookShareAds = function (product) {
        var random = generateRandom(111111, 999999);
        var gen_pro_id = random + product + random;
        var url = 'https://www.thebusinessclub.com/order/' + gen_pro_id;
        window.plugins.socialsharing.shareViaFacebook(null, null /* img */ , url, null, function (errormsg) {
            // window.open('https://www.facebook.com/sharer.php?s=100&&p[caption]=dasads&p[url]='.url, '_system');

        }, function (err) {
            $scope.showError("You have to install facebook");
        });
    };
    $scope.facebookShareAdstmp = function (product) {
        var random = generateRandom(111111, 999999);
        var gen_pro_id = random + product + random;
        var url = 'https://www.thebusinessclub.com/order/' + gen_pro_id;
        window.plugins.socialsharing.shareViaFacebook('Message via Facebook', 'http://www.flooringvillage.co.uk/ekmps/shops/flooringvillage/images/request-a-sample--547-p.jpg', null /* url */ , function () {
            // alert.log('share ok');
        }, function (errormsg) {
        });
    };
    $scope.twitterShareAds = function (product) {
        var random = generateRandom(111111, 999999);
        var gen_pro_id = random + product + random;
        var url = 'https://www.thebusinessclub.com/order/' + gen_pro_id;
        var share_url = 'https://twitter.com/share?url=' + url;
        window.plugins.socialsharing.shareViaTwitter(null, null /* img */ , url, null, function (errormsg) {
            window.open(share_url, '_system');
        });
    };
    $scope.linkedinShareAds = function (product, name) {
        var random = generateRandom(111111, 999999);
        var gen_pro_id = random + product + random;
        var url = 'https://www.thebusinessclub.com/order/' + gen_pro_id;
        var share_url = 'https://www.linkedin.com/shareArticle?mini=true&url=https://www.thebusinessclub.com/dev366/order/161372193';
        $scope.moreShocialShareAll(name, url);
    };
    $scope.moreShocialShare = function (id, name, desc, img, price) {
        var random = generateRandom(111111, 999999);
        var gen_pro_id = random + id + random;
        var url = 'https://www.thebusinessclub.com/order/' + gen_pro_id;
        $ionicLoading.show();
        window.plugins.socialsharing.share(name, null, null, url, function (success) {
            $ionicLoading.hide();
        }, function (error) {
            $ionicLoading.hide();
            $scope.showSuccess(error);
        });
    };
    $scope.moreShocialShareExpire = function (id, name, desc, img_url, img) {
        $ionicLoading.show();
        var random = generateRandom(111111, 999999);
        var gen_pro_id = random + id + random;
        var url = 'https://www.thebusinessclub.com/order/' + gen_pro_id;
        var full_img = img_url + img;
        $scope.moreShocialShareAll(name, url, full_img);
    };
    $scope.whatsappShareAds = function (product) {
        var random = generateRandom(111111, 999999);
        var gen_pro_id = random + product + random;
        var url = 'https://www.thebusinessclub.com/order/' + gen_pro_id;
        window.plugins.socialsharing.shareViaWhatsApp(null, null /* img */ , url, null, function (errormsg) {
            $scope.showError("Cannot Share. Please try again later!");
        });
    };
    $scope.sendSMSAds = function (product) {
        var random = generateRandom(111111, 999999);
        var gen_pro_id = random + product + random;
        var url = 'https://www.thebusinessclub.com/order/' + gen_pro_id;
        window.plugins.socialsharing.shareViaSMS(url);
    };
    $scope.moreShocialShareExpireTemp = function (id, name, desc, img_url, img) {
        $ionicLoading.show();
        var random = generateRandom(111111, 999999);
        var gen_pro_id = random + id + random;
        var url = 'https://www.thebusinessclub.com/order/' + gen_pro_id;
        window.plugins.socialsharing.share(name, null, img, null, function (success) {
            $ionicLoading.hide();
        }, function (error) {
            $ionicLoading.hide();
            $scope.showSuccess(error);
        });
    };











    ionic.material.ink.displayEffect();
});














































app.controller('ClubCtrl', function ($scope, $rootScope, TBC, TbcAuthService, $controller, $cordovaFile, $ionicLoading, $cordovaCamera, $cordovaFileTransfer, $ionicScrollDelegate, $ionicActionSheet, Data, $ionicModal, $ionicPopup, $timeout) {
    api_key = window.localStorage.getItem('userkey');
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = false;
    });
    $scope.clubGallery = [];
    $scope.img = [];
    $scope.var61 = 1;

    $scope.scrollTop = function () {
        $ionicScrollDelegate.scrollTop();
    };

    $scope.openModalAddClub = function (id = null) {

        $scope.modalAddClub = null;
        $scope.clubTitle = 'Add New Club';
        $scope.club = {};
        $scope.clubGallery = [];
        $scope.clubGalleryImages = [];
        $scope.img = [];

        $ionicModal.fromTemplateUrl('templates/modal/mdl_add_club.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {

            Data.send({
                api_key: api_key,
                start: 0,
                count: 10
            }, 'getCounties').then(function (res) {
                $scope.counties = JSON.parse(JSON.stringify(res)).counties;
                if (JSON.parse(JSON.stringify(res)).counties.length <= 0) {
                    $scope.enable_town = false;
                } else {
                    $scope.enable_town = true;
                }
                $scope.modalAddClub.show();
            }, function (x) {
                $scope.showError("Check your connection!");
            });

            $scope.modalAddClub = modal;
            if (!id) {
                $scope.clubTitle = 'Add New Club';
                $scope.club = {
                    club_name: "",
                    club_description: "",
                    county_id: "",
                    town_id: ""
                };
                $scope.clubImagewithUrl = "";
                $scope.clubGalleryImages = [];
                $scope.townsForClubCreation = [];
                $scope.clubImageId = null;
            } else {
                $scope.clubTitle = 'Edit Club';
                Data.send({
                    api_key: api_key,
                    club_id: id
                }, 'getClubDetailsForEdit').then(function (res) {
                    let countyForEdit = JSON.parse(JSON.stringify(res)).group_details;
                    if (typeof countyForEdit == 'object') {
                        $scope.getTowns(countyForEdit.county);
                        $scope.club.club_id = countyForEdit.id;
                        $scope.club.club_name = countyForEdit.group_name;
                        $scope.club.club_description = countyForEdit.group_desc;
                        $scope.club.county_id = countyForEdit.county;
                        $scope.club.town_id = countyForEdit.town_city;
                        let clubGalleryImages = (countyForEdit.group_gallery) ? countyForEdit.group_gallery : [];
                        clubGalleryImages.forEach(function (value, key) {
                            $scope.clubGallery.push(value['file_id']);
                            $scope.img.push(value['file_name']);
                        });
                        $scope.clubImageId = countyForEdit.clubLogoID;
                        $scope.clubImagewithUrl = countyForEdit.clubLogo;
                    } else {
                        console.log($scope.countyForEdit);
                    }

                }, function (x) {
                    $scope.showError("Check your connection!");
                });
            }




        });
    };

    $scope.closeModalAddClub = function () {
        $scope.modalAddClub.hide();
    };
    ionic.material.ink.displayEffect();

    $scope.TabChangeClubList = function (num) {
        $scope.var61 = num;
        if (num == 3) {
            $scope.county = "All";
            $scope.town_id = "All";
        }
    };


    //club actionsheet
    $scope.showClubAction = function(club_id) {
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Edit'
            }, {
                text: '<span class="text-red"> Delete </span>'
            }],
            titleText: 'Club Option',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    $scope.openModalAddClub(club_id);
                } else if (index == 1) {
                    $scope.deleteClub(club_id);
                }
                return true;
            }
        });
    };


    
    $scope.deleteClub = function (club_id) {
        var confirmPdel = $ionicPopup.confirm({
            title: 'Are you sure you want to delete this club? Relevant events will too deleted',
            template: ''
        });
        confirmPdel.then(function (res) {
            if (res) {
                $scope.confirmDeleteClub(club_id);
            } else {}
        });
        $timeout(function () {
            confirmPdel.close();
        }, 10000);
    };
    $scope.confirmDeleteClub = function (club_id) {
        Data.send({
            api_key: api_key,
            club_id: club_id
        }, 'deleteClubDetails').then(function (res) {
            if ($scope.my_club != null) {
                angular.forEach($scope.my_club, function (value, key) {
                    if (club_id == $scope.my_club[key].id) {
                        $scope.my_club.splice(key, 1);
                    }
                });
            }
            $scope.getMyClub();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.selectClubLogo = function (num_img, img_type) {
        TbcAuthService.getFileUploadPermission();
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Load from Library'
            }, {
                text: 'Use Camera'
            }],
            titleText: 'Select Image',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    $scope.clubLogoChange(1, img_type);
                } else if (index == 1) {
                    $scope.clubLogoChangeCamera(1, img_type);
                }
                return true;
            }
        });
    };
    $scope.clubLogoChange = function (num_img, img_type) {
        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            window.imagePicker.getPictures(function (results) {
                for (var i = 0; i < results.length; i++) {
                    $ionicLoading.show();
                    //$rootScope.clubImagewithUrl = results[i];
                    var options = new FileUploadOptions();
                    options.fileKey = "uploadfile";
                    options.fileName = results[i].substr(results[i].lastIndexOf('/') + 1);
                    options.mimeType = "image/jpeg";
                    var params = new Object();
                    params.api_key = api_key;
                    params.src = img_type;
                    options.params = params;
                    options.chunkedMode = false;
                    $cordovaFileTransfer.upload(encodeURI(TBC.URL + 'imageUploadToServer'), results[i], options).then(function (result) {
                        var res = JSON.parse(result.response);
                        $scope.clubImageId = res.file_id;
                        $scope.clubImagewithUrl = res.file_location;
                        $ionicLoading.hide();
                    }, function (err) {}, function (progress) {
                        if (progress.lengthComputable) {} else {}
                        $ionicLoading.hide();
                    });
                }
            }, function (error) {
                console.log('Error: ' + error);
                $ionicLoading.hide();
            }, {
                maximumImagesCount: num_img,
                quality: 60
            });
        }
    };
    $scope.clubLogoChangeCamera = function (num_img, img_type) {
        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            var cameraOptions = {
                quality: 60,
                destinationType: Camera.DestinationType.FILE_URI,
                encodingType: Camera.EncodingType.JPEG,
                mediaType: Camera.MediaType.PICTURE,
                allowEdit: true
            };
            navigator.camera.getPicture(function (success) {
                $ionicLoading.show();
                //$rootScope.clubImagewithUrl = success;
                var options = new FileUploadOptions();
                options.fileKey = "uploadfile";
                options.fileName = success.substr(success.lastIndexOf('/') + 1);
                options.mimeType = "image/jpeg";
                var params = new Object();
                params.api_key = api_key;
                params.src = img_type;
                options.params = params;
                options.chunkedMode = false;
                $cordovaFileTransfer.upload(encodeURI(TBC.URL + 'imageUploadToServer'), success, options).then(function (result) {
                    console.log(result);
                    var res = JSON.parse(result.response);
                    $scope.clubImageId = res.file_id;
                    $scope.clubImagewithUrl = res.file_location;
                    $ionicLoading.hide();
                }, function (err) {}, function (progress) {
                    if (progress.lengthComputable) {} else {}
                    $ionicLoading.hide();
                });
            }, function (error) {
                $ionicLoading.hide();
            }, cameraOptions);
        }
    };


    $scope.getTownForClubCreation = function (county) {
        Data.send({
            county_id: county
        }, 'getTownsForCreateClub').then(function (res) {
            $scope.townsForClubCreation = JSON.parse(JSON.stringify(res)).towns;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.getTowns = function (county) {
        Data.send({
            county_id: county
        }, 'getTowns').then(function (res) {
            $scope.townsForClubCreation = JSON.parse(JSON.stringify(res)).towns;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.selectClubImages = function (num, img_type) {
        TbcAuthService.getFileUploadPermission();
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Load from Library'
            }, {
                text: 'Use Camera'
            }],
            titleText: 'Select Image',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    document.addEventListener("deviceready", onDeviceReady, false);

                    function onDeviceReady() {
                        window.imagePicker.getPictures(function (results) {
                            for (var i = 0; i < results.length; i++) {
                                //$scope.img.push(results[i]);
                                $scope.uploadClubGalleryImage(results[i], img_type);
                            }
                        }, function (error) {
                            console.log('Error: ' + error);
                        }, {
                            maximumImagesCount: num,
                            quality: 60
                        });
                    }
                } else if (index == 1) {
                    document.addEventListener("deviceready", onDeviceReady, false);

                    function onDeviceReady() {
                        var cameraOptions = {
                            quality: 60,
                            destinationType: Camera.DestinationType.FILE_URI,
                            encodingType: Camera.EncodingType.JPEG,
                            mediaType: Camera.MediaType.PICTURE,
                            allowEdit: true
                        };
                        navigator.camera.getPicture(function (success) {
                            //$scope.img.push(success);
                            $scope.uploadClubGalleryImage(success, img_type);
                        }, function (error) {
                            // $scope.showError('Check your camera option');
                        }, cameraOptions);
                    }
                }

                return true;
            }
        });
    };
    $scope.uploadClubGalleryImage = function (img, img_type) {
        $ionicLoading.show();
        var file_ids = [];

        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            var options = new FileUploadOptions();
            options.fileKey = "uploadfile";
            options.fileName = img.substr(img.lastIndexOf('/') + 1);
            options.mimeType = "image/jpeg";
            var params = new Object();
            params.api_key = api_key;
            params.src = img_type;
            options.params = params;
            options.chunkedMode = false;
            $cordovaFileTransfer.upload(encodeURI(TBC.URL + 'imageUploadToServer'), img, options).then(function (r) {
                var res = JSON.parse(r.response);
                console.log(res);
                if (res.file_id) {
                    $scope[img_type].push(res.file_id);
                    $scope.img.push(res.file_location);
                }
                $ionicLoading.hide();

            }, function (err) {
                console.log(err);
                $ionicLoading.hide();
            }, function (progress) {
                if (progress.lengthComputable) {

                } else {}
                $ionicLoading.hide();
            });

        }
    };

    $scope.removeSelectedImage = function (index, img_type) {
        if (!isNaN(index)) {
            $scope[img_type].splice(index, 1);
            $scope.img.splice(index, 1);
        }
    };

    $scope.removeUploadImage = function (item) {
        var index = $scope.img.indexOf(item);
        $scope.img.splice(index, 1);
    };

    $scope.addClub = function (clubDetails) {
        $ionicLoading.show();

        var messgePop = '';
        if (clubDetails.club_name == undefined || clubDetails.club_name == '') {
            messgePop = "Club Name should be filled";
            $scope.showError(messgePop, 2000);
        } else {
            Data.send({
                api_key: api_key,
                club_id: (!$scope.club.club_id) ? 'undefined' : $scope.club.club_id,
                club_name: clubDetails.club_name,
                county: clubDetails.county_id,
                town_city: clubDetails.town_id,
                club_logo: $scope.clubImageId,
                club_desc: clubDetails.club_description,
                club_images: $scope.clubGallery.join(',')
            }, 'addEditClub').then(function (res) {
                $ionicLoading.hide();
                $scope.showSuccess('Successfully completed', 2000);

                setTimeout(
                    function () {
                        $scope.closeModalAddClub();

                        if($scope.club.club_id){
                            $scope.viewClubDetails($scope.club.club_id);
                        }else{
                            $scope.getMyClub();
                        }

                        $ionicScrollDelegate.resize();
                        $scope.$broadcast('scroll.refreshComplete');
                    }, 2000
                );


            }, function (x) {
                console.log(x);
                $scope.showError("Check your connection!");
            });

        }
    };

    $scope.viewClubDetails = function (club_id) {
        $scope.clubDetails = [];
        Data.send({
            api_key: api_key,
            club_id: club_id
        }, 'viewClubDetails').then(function (res) {

            $scope.clubDetails = res.group_details;
            $scope.clubDetails.clubLogo = res.group_details.img_url_pro + res.group_details.image;
            $scope.all_events = res.group_details.event_details;
            $scope.all_members = res.group_details.member_details;
            $scope.requested_members = res.group_details.requested_member_details;
            $scope.member_ads = res.member_ads;

            if (res.group_details.events_count > 3) {
                $scope.eventsMore = true;
                $scope.all_ev_start = 3;
                $scope.all_ev_limit = 3;

            } else {
                $scope.eventsMore = false;

            }

            if (res.group_details.members_count > 3) {
                $scope.membersMore = true;
                $scope.all_mem_start = 3;
                $scope.all_mem_limit = 3;

            } else {
                $scope.membersMore = false;

            }

            if (res.group_details.requested_members_count > 3) {
                $scope.requestedmembersMore = true;
                $scope.Rq_mem_start = 3;
                $scope.Rq_mem_limit = 3;

            } else {
                $scope.requestedmembersMore = false;

            }

            if (res.member_ads_count > 0) {
                $scope.adsMore = true;
                $scope.all_ad_start = 5;
                $scope.all_ad_limit = 5;

            } else {
                $scope.adsMore = false;

            }

            // $ionicSlideBoxDelegate.update();
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.clubSearch = '';
    $scope.joinedClubSearch = '';

    $scope.getOurClubsSearch = function (search) {

        $scope.clubSearch = search;
        $scope.AllOurGroups();

    };

    $scope.getJoinedClubsSearch = function (search) {

        $scope.joinedClubSearch = search;
        $scope.allJoinedGroups();

    };

    $scope.getMyClub = function () {
        $ionicLoading.show();
        Data.send({
            api_key: api_key
        }, 'getMyClubDetails').then(function (res) {
            if (JSON.parse(JSON.stringify(res)).success > 0) {
                $scope.my_club = JSON.parse(JSON.stringify(res)).club_details;
                $scope.having_joined_clubs = res.having_joined_clubs;
                $scope.have_club = true;

                if(res.having_joined_clubs != false){
                    $scope.allJoinedGroups();
                }

            } else {
                $scope.have_club = false;
                $ionicLoading.hide();
            }
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.clubRefresh = function (var61) {
        if (var61 == 1) {
            $scope.getMyClub();
        }
        if (var61 == 2) {
            $scope.AllOurGroups();
        }
    };

    $scope.allJoinedGroups = function () {
        $scope.joined_clubs = [];
        $scope.joined_gp_start = 0;
        $scope.joined_gp_limit = 10;
        // $scope.adSearch='';
        Data.send({
            api_key: api_key,
            start: $scope.joined_gp_start,
            count: $scope.joined_gp_limit,
            search: $scope.joinedClubSearch
        }, 'allJoinedGroups').then(function (resData) {
            $scope.all_joined_clubs = JSON.parse(JSON.stringify(resData)).all_joined_clubs;
            if (JSON.parse(JSON.stringify(resData)).all_joined_clubs_count > 10) {
                $scope.joined_gp_start = 10;
                $scope.joined_gp_limit = 10;
                $scope.joinedGroupsMore = true;
            } else {
                $scope.joinedGroupsMore = false;
            }
            $scope.all_joined_clubs_count = JSON.parse(JSON.stringify(resData)).all_joined_clubs_count;
            $ionicLoading.hide();
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.getAllJoinedGroupsMore = function () {
        Data.send({
            start: $scope.joined_gp_start,
            count: $scope.joined_gp_limit,
            search: $scope.joinedClubSearch
        }, 'allJoinedGroups').then(function (res) {
            $scope.len = JSON.parse(JSON.stringify(res)).all_joined_clubs;
            $scope.all_joined_clubs = $scope.all_events.concat(JSON.parse(JSON.stringify(res)).all_joined_clubs);
            $scope.all_joined_clubs_count = JSON.parse(JSON.stringify(res)).all_joined_clubs_count;
            $scope.joined_gp_start = $scope.joined_gp_start + 10;
            $scope.joined_gp_limit = 10;
            if ($scope.all_joined_clubs.length > JSON.parse(JSON.stringify(res)).all_joined_clubs_count) {
                $scope.joinedGroupsMore = true;
            } else {
                $scope.joinedGroupsMore = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };


    $scope.AllOurGroups = function () {
        $scope.ourGroups = [];
        $scope.all_gp_start = 0;
        $scope.all_gp_limit = 10;
        //$scope.adSearch='';
        Data.send({
            api_key: api_key,
            start: $scope.all_gp_start,
            count: $scope.all_gp_limit,
            search: $scope.clubSearch
        }, 'AllOurGroups').then(function (resData) {
            $scope.all_our_clubs = JSON.parse(JSON.stringify(resData)).all_our_clubs;
            if (JSON.parse(JSON.stringify(resData)).all_our_clubs_count > 10) {
                $scope.all_gp_start = 10;
                $scope.all_gp_limit = 10;
                $scope.groupsMore = true;
            } else {
                $scope.groupsMore = false;
            }
            $scope.all_our_clubs_count = JSON.parse(JSON.stringify(resData)).all_our_clubs_count;
            $ionicLoading.hide();
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.getAllOurGroupsMore = function () {
        Data.send({
            start: $scope.all_gp_start,
            count: $scope.all_gp_limit,
            search: $scope.clubSearch
        }, 'AllOurGroups').then(function (res) {
            $scope.len = JSON.parse(JSON.stringify(res)).all_our_clubs;
            $scope.all_our_clubs = $scope.all_events.concat(JSON.parse(JSON.stringify(res)).all_our_clubs);
            $scope.all_our_clubs_count = JSON.parse(JSON.stringify(res)).all_our_clubs_count;
            $scope.all_gp_start = $scope.all_gp_start + 10;
            $scope.all_gp_limit = 10;
            if ($scope.all_our_clubs.length > JSON.parse(JSON.stringify(res)).all_our_clubs_count) {
                $scope.groupsMore = true;
            } else {
                $scope.groupsMore = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.getMyClub();
    $scope.AllOurGroups();

});

app.controller('ViewClubCtrl', function ($scope, $rootScope, $controller, TBC, TbcAuthService, $cordovaFile, $ionicLoading, $cordovaCamera, $ionicScrollDelegate, Data, $ionicActionSheet, $cordovaFileTransfer, $ionicModal, $ionicPopup, $stateParams, $filter, $state, $timeout) {
    api_key = window.localStorage.getItem('userkey');
    // $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    //     viewData.enableBack = false;
    // });

    $ionicLoading.show();
    $scope.eventGallery = [];
    $scope.img = [];
    var club_id = $stateParams.id;

    $scope.vars1 = 1;
    $scope.varm1 = 1;
    $scope.TabChangeViewClub = function (num) {
        $scope.vars1 = num;
    };

    $scope.TabChangeViewMembers = function (num) {
        $scope.varm1 = num;
    };

    $scope.readNotifications = function (type, id) {
        Data.send({
            api_key: api_key,
            type: type,
            id: id
        }, 'userNotificationUpdate').then(function (res) {}, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.getTowns = function (county) {
        Data.send({
            county_id: county
        }, 'getTowns').then(function (res) {
            $scope.townsForClubCreation = JSON.parse(JSON.stringify(res)).towns;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.openModalAddClub = function (id) {

        $scope.modalAddClub = null;
        $scope.clubTitle = 'Edit Club';
        $scope.club = {};
        $scope.clubGallery = [];
        $scope.clubGalleryImages = [];
        $scope.img = [];

        $ionicModal.fromTemplateUrl('templates/modal/mdl_add_club.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {

            Data.send({
                api_key: api_key,
                start: 0,
                count: 10
            }, 'getCounties').then(function (res) {
                $scope.counties = JSON.parse(JSON.stringify(res)).counties;
                if (JSON.parse(JSON.stringify(res)).counties.length <= 0) {
                    $scope.enable_town = false;
                } else {
                    $scope.enable_town = true;
                }
                $scope.modalAddClub.show();
            }, function (x) {
                $scope.showError("Check your connection!");
            });

            $scope.modalAddClub = modal;
            
            Data.send({
                api_key: api_key,
                club_id: id
            }, 'getClubDetailsForEdit').then(function (res) {
                let countyForEdit = JSON.parse(JSON.stringify(res)).group_details;
                if (typeof countyForEdit == 'object') {
                    $scope.getTowns(countyForEdit.county);
                    $scope.club.club_id = countyForEdit.id;
                    $scope.club.club_name = countyForEdit.group_name;
                    $scope.club.club_description = countyForEdit.group_desc;
                    $scope.club.county_id = countyForEdit.county;
                    $scope.club.town_id = countyForEdit.town_city;
                    let clubGalleryImages = (countyForEdit.group_gallery) ? countyForEdit.group_gallery : [];
                    clubGalleryImages.forEach(function (value, key) {
                        $scope.clubGallery.push(value['file_id']);
                        $scope.img.push(value['file_name']);
                    });
                    $scope.clubImageId = countyForEdit.clubLogoID;
                    $scope.clubImagewithUrl = countyForEdit.clubLogo;
                } else {
                    console.log($scope.countyForEdit);
                }

            }, function (x) {
                $scope.showError("Check your connection!");
            });




        });
    };

    $scope.closeModalAddClub = function () {
        $scope.modalAddClub.hide();
    };
    ionic.material.ink.displayEffect();
    
    
    $scope.clubImageView = function (adImage) {

        var wllImg = '<ion-scroll overflow-scroll="false" zooming="true" direction="xy" ><img src="' + adImage + '"></ion-scroll>';

        var alertPopup = $ionicPopup.alert({
            template: wllImg,
            cssClass: 'ads-Image-PopUp',
            buttons: [{
                text: 'Cancel',
                type: 'button-clear'
            }]
        });
    };

    $scope.doRefresh = function (club_id) {

        Data.send({
            api_key: api_key,
            club_id: club_id
        }, 'viewClubDetails').then(function (res) {

            $scope.clubDetails = res.group_details;
            $scope.clubDetails.clubLogo = res.group_details.img_url_pro + res.group_details.image;
            $scope.all_events = res.group_details.event_details;
            $scope.all_members = res.group_details.member_details;
            $scope.requested_members = res.group_details.requested_member_details;
            $scope.member_ads = res.member_ads;

            if (res.group_details.events_count > 3) {
                $scope.eventsMore = true;
                $scope.all_ev_start = 3;
                $scope.all_ev_limit = 3;

            } else {
                $scope.eventsMore = false;

            }

            if (res.group_details.members_count > 3) {
                $scope.membersMore = true;
                $scope.all_mem_start = 3;
                $scope.all_mem_limit = 3;

            } else {
                $scope.membersMore = false;

            }

            if (res.group_details.requested_members_count > 3) {
                $scope.requestedmembersMore = true;
                $scope.Rq_mem_start = 3;
                $scope.Rq_mem_limit = 3;

            } else {
                $scope.requestedmembersMore = false;

            }

            if (res.member_ads_count > 0) {
                $scope.adsMore = true;
                $scope.all_ad_start = 5;
                $scope.all_ad_limit = 5;

            } else {
                $scope.adsMore = false;

            }

            // $ionicSlideBoxDelegate.update();
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
            $scope.closeModalAddClub();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $ionicModal.fromTemplateUrl('templates/modal/mdl_add_club_member.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalAddClubMember = modal;
    });
    $scope.openModalAddClubMember = function (club_id) {
        $scope.modalAddClubMember.show();
        $scope.loadFriendList();
        
    };
    $scope.closeModalAddClubMember = function () {
        $scope.viewClubDetails(club_id);
        $scope.modalAddClubMember.hide();
    };

    $scope.loadFriendList = function(){
        Data.send({
            api_key: api_key,
            club_id: club_id
        }, 'getClubAdminFriendsNotInTheGroup').then(function (res) {

            if(res.success == 1){

                $scope.users = JSON.parse(JSON.stringify(res)).users;
                if (JSON.parse(JSON.stringify(res)).users.length <= 0) {
                    $scope.have_users = true;
                } else {
                    $scope.have_users = false;
                }

            }

        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.openFriendsProfile = function (friend_id) {
        $scope.closeModalAddClubMember();
        
        $state.go('app.friends_profile', {
            friendid: friend_id
        });
    };

    $scope.addFriendToTheClub = function (friend_id) {
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            club_id: club_id,
            frnd_id: friend_id
        }, 'addFriendToTheClub').then(function (res) {
            $ionicLoading.hide();
            if(res.success == 1){

                $scope.loadFriendList();
                $scope.showSuccess('Member Added Successfully');

            }

        }, function (x) {
            $scope.showError("Check your connection!");
        });

    };

    $scope.joinClub = function () {
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            club_id: club_id
        }, 'userRequestJoinClub').then(function (res) {
            $ionicLoading.hide();
            if(res.success == 1){

                $scope.viewClubDetails(club_id);
                $scope.showSuccess('Join Request Sent Successfully');

            }

        }, function (x) {
            $scope.showError("Check your connection!");
        });

    };

    $scope.exitClub = function () {
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            club_id: club_id
        }, 'userExitFromClub').then(function (res) {
            $ionicLoading.hide();
            if(res.success == 1){

                $scope.viewClubDetails(club_id);
                $scope.showSuccess('You have Exit Successfully');

            }

        }, function (x) {
            $scope.showError("Check your connection!");
        });

    };

    $scope.cancelClubRequest = function () {
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            club_id: club_id
        }, 'cancelClubRequest').then(function (res) {
            $ionicLoading.hide();
            if(res.success == 1){

                $scope.viewClubDetails(club_id);
                $scope.showSuccess('Club Request Cancelled Successfully');

            }

        }, function (x) {
            $scope.showError("Check your connection!");
        });

    };


    $scope.exitClubConfirmation = function () {
        var confirmDiscon = $ionicPopup.confirm({
            title: 'Are you sure you want to Exit from this club ?',
            template: ''
        });
        confirmDiscon.then(function (res) {
            if (res) {
                $scope.exitClub();
            } else {}
        });
        $timeout(function () {
            confirmDiscon.close();
        }, 1000000);
    };

    $scope.viewClubDetails = function () {

        Data.send({
            api_key: api_key,
            club_id: club_id
        }, 'viewClubDetails').then(function (res) {

            $scope.clubDetails = res.group_details;
            $scope.clubDetails.clubLogo = res.group_details.img_url_pro + res.group_details.image;
            $scope.all_events = res.group_details.event_details;
            $scope.all_members = res.group_details.member_details;
            $scope.requested_members = res.group_details.requested_member_details;
            $scope.member_ads = res.member_ads;

            if (res.group_details.events_count > 3) {
                $scope.eventsMore = true;
                $scope.all_ev_start = 3;
                $scope.all_ev_limit = 3;

            } else {
                $scope.eventsMore = false;

            }

            if (res.group_details.members_count > 3) {
                $scope.membersMore = true;
                $scope.all_mem_start = 3;
                $scope.all_mem_limit = 3;

            } else {
                $scope.membersMore = false;

            }

            if (res.group_details.requested_members_count > 3) {
                $scope.requestedmembersMore = true;
                $scope.Rq_mem_start = 3;
                $scope.Rq_mem_limit = 3;

            } else {
                $scope.requestedmembersMore = false;

            }

            if (res.member_ads_count > 0) {
                $scope.adsMore = true;
                $scope.all_ad_start = 5;
                $scope.all_ad_limit = 5;

            } else {
                $scope.adsMore = false;

            }

            // $ionicSlideBoxDelegate.update();
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.viewClubDetails();

    $scope.readNotifications = function (type, id) {
        Data.send({
            api_key: api_key,
            type: type,
            id: id
        }, 'userNotificationUpdate').then(function (res) {}, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.clubImagePopUp = function (url, clubViewImage) {
        var alertPopup = $ionicPopup.alert({
            template: '<ion-scroll overflow-scroll="false" zooming="true" direction="xy" ><img src="' + url + clubViewImage + '"></ion-scroll>',
            cssClass: 'wall-Image-PopUp',
            buttons: [{
                text: 'Cancel',
                type: 'button-clear'
            }]
        });
    };

    $scope.getAllClubEventsMore = function () {

        Data.send({
            start: $scope.all_ev_start,
            count: $scope.all_ev_limit,
            club_id: club_id
        }, 'allClubEventsClubView').then(function (res) {
            $scope.len = JSON.parse(JSON.stringify(res)).all_events;

            $scope.all_events = $scope.all_events.concat(JSON.parse(JSON.stringify(res)).all_events);
            $scope.all_events_count = JSON.parse(JSON.stringify(res)).all_events_count;
            $scope.all_ev_start = $scope.all_ev_start + 3;
            $scope.all_ev_limit = 3;

            if ($scope.all_events.length < JSON.parse(JSON.stringify(res)).all_events_count) {
                $scope.eventsMore = true;
            } else {
                $scope.eventsMore = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.getAllClubMembersMore = function () {

        Data.send({
            start: $scope.all_mem_start,
            count: $scope.all_mem_limit,
            club_id: club_id
        }, 'allClubMembersClubView').then(function (res) {
            $scope.len = JSON.parse(JSON.stringify(res)).all_members;

            $scope.all_members = $scope.all_members.concat(JSON.parse(JSON.stringify(res)).all_members);
            $scope.all_members_count = JSON.parse(JSON.stringify(res)).all_members_count;
            $scope.all_mem_start = $scope.all_mem_start + 3;
            $scope.all_mem_limit = 3;

            if ($scope.all_members.length < JSON.parse(JSON.stringify(res)).all_members_count) {
                $scope.membersMore = true;
            } else {
                $scope.membersMore = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.getAllClubRequestedMembersMore = function () {

        Data.send({
            start: $scope.rqst_mem_start,
            count: $scope.rqst_mem_limit,
            club_id: club_id
        }, 'allClubResquestedMembersClubView').then(function (res) {
            $scope.len = JSON.parse(JSON.stringify(res)).requested_members;

            $scope.requested_members = $scope.requested_members.concat(JSON.parse(JSON.stringify(res)).requested_members);
            $scope.requested_members_count = JSON.parse(JSON.stringify(res)).requested_members_count;
            $scope.rqst_mem_limit = $scope.rqst_mem_limit + 3;
            $scope.rqst_mem_limit = 3;

            if ($scope.requested_members.length < JSON.parse(JSON.stringify(res)).requested_members_count) {
                $scope.requestedmembersMore = true;
            } else {
                $scope.requestedmembersMore = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.getAllMemberAdsMore = function () {

        Data.send({
            start: $scope.all_ad_start,
            count: $scope.all_ad_limit,
            club_id: club_id
        }, 'getAllMemberAdsMore').then(function (res) {
            $scope.len = JSON.parse(JSON.stringify(res)).member_ads;

            $scope.member_ads = $scope.member_ads.concat(JSON.parse(JSON.stringify(res)).member_ads);
            $scope.member_ads_count = JSON.parse(JSON.stringify(res)).member_ads_count;
            $scope.all_ad_start = $scope.all_ad_start + 3;
            $scope.all_ad_limit = 3;

            if ($scope.member_ads.length < JSON.parse(JSON.stringify(res)).member_ads_count) {
                $scope.adsMore = true;
            } else {
                $scope.adsMore = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };


    $scope.removeGroupMember = function (mem_id) {
        Data.send({
            api_key: api_key,
            club_id: club_id,
            mem_id: mem_id
        }, 'removeGroupMember').then(function (res) {
            if (res.success == 1) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Group member removed successfully',
                    template: ''
                });

                $scope.viewClubDetails(club_id);

            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.removeGroupMemberRequest = function (mem_id) {
        Data.send({
            api_key: api_key,
            club_id: club_id,
            mem_id: mem_id
        }, 'removeGroupMemberRequest').then(function (res) {
            if (res.success == 1) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Member request cancelled successfully',
                    template: ''
                });

                $scope.viewClubDetails(club_id);

            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.selectClubImages = function (num, img_type) {
        TbcAuthService.getFileUploadPermission();
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Load from Library'
            }, {
                text: 'Use Camera'
            }],
            titleText: 'Select Image',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    document.addEventListener("deviceready", onDeviceReady, false);

                    function onDeviceReady() {
                        window.imagePicker.getPictures(function (results) {
                            for (var i = 0; i < results.length; i++) {
                                //$scope.img.push(results[i]);
                                $scope.uploadClubGalleryImage(results[i], img_type);
                            }
                        }, function (error) {
                            console.log('Error: ' + error);
                        }, {
                            maximumImagesCount: num,
                            quality: 60
                        });
                    }
                } else if (index == 1) {
                    document.addEventListener("deviceready", onDeviceReady, false);

                    function onDeviceReady() {
                        var cameraOptions = {
                            quality: 60,
                            destinationType: Camera.DestinationType.FILE_URI,
                            encodingType: Camera.EncodingType.JPEG,
                            mediaType: Camera.MediaType.PICTURE,
                            allowEdit: true
                        };
                        navigator.camera.getPicture(function (success) {
                            //$scope.img.push(success);
                            $scope.uploadClubGalleryImage(success, img_type);
                        }, function (error) {
                            // $scope.showError('Check your camera option');
                        }, cameraOptions);
                    }
                }

                return true;
            }
        });
    };





    $scope.uploadClubGalleryImage = function (img, img_type) {
        $ionicLoading.show();
        var file_ids = [];

        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            var options = new FileUploadOptions();
            options.fileKey = "uploadfile";
            options.fileName = img.substr(img.lastIndexOf('/') + 1);
            options.mimeType = "image/jpeg";
            var params = new Object();
            params.api_key = api_key;
            params.src = img_type;
            options.params = params;
            options.chunkedMode = false;
            $cordovaFileTransfer.upload(encodeURI(TBC.URL + 'imageUploadToServer'), img, options).then(function (r) {
                var res = JSON.parse(r.response);
                //console.log(res);
                if (res.file_id) {
                    $scope[img_type].push(res.file_id);
                    $scope.img.push(res.file_location);
                }
                $ionicLoading.hide();

            }, function (err) {
                console.log(err);
                $ionicLoading.hide();
            }, function (progress) {
                if (progress.lengthComputable) {

                } else {}
                $ionicLoading.hide();
            });

        }
    };

    $scope.removeSelectedImage = function (index, img_type) {
        if (!isNaN(index)) {
            $scope[img_type].splice(index, 1);
            $scope.img.splice(index, 1);
        }
    };

    $scope.removeUploadImage = function (item) {
        var index = $scope.img.indexOf(item);
        $scope.img.splice(index, 1);
    };

    $scope.addClub = function (clubDetails) {
        $ionicLoading.show();

        var messgePop = '';
        if (clubDetails.club_name == undefined || clubDetails.club_name == '') {
            messgePop = "Club Name should be filled";
            $scope.showError(messgePop, 2000);
        } else {
            Data.send({
                api_key: api_key,
                club_id: (!$scope.club.club_id) ? 'undefined' : $scope.club.club_id,
                club_name: clubDetails.club_name,
                county: clubDetails.county_id,
                town_city: clubDetails.town_id,
                club_logo: $scope.clubImageId,
                club_desc: clubDetails.club_description,
                club_images: $scope.clubGallery.join(',')
            }, 'addEditClub').then(function (res) {
                $ionicLoading.hide();
                $scope.showSuccess('Successfully completed', 2000);

                setTimeout(
                    function () {
                        $scope.doRefresh($scope.club.club_id);
                        $ionicScrollDelegate.resize();
                        $scope.$broadcast('scroll.refreshComplete');
                    }, 2000
                );


            }, function (x) {
                console.log(x);
                $scope.showError("Check your connection!");
            });

        }
    };


    $scope.addClubEvent = function (evtDetails) {

        $ionicLoading.show();
        var messgePop = '';
        if (evtDetails.title == undefined || evtDetails.venue == '' || evtDetails.event_date == '') {
            messgePop = "Please fill all event details";
            $scope.showError(messgePop, 2000);
        } else {
            Data.send({
                api_key: api_key,
                event_id: (!$scope.clubEvent.event_id) ? 'undefined' : $scope.clubEvent.event_id,
                club_id: !$scope.clubEvent.club_id ? evtDetails.cluclub_id : $scope.clubEvent.club_id,
                title: evtDetails.title,
                venue: evtDetails.venue,
                event_date: $filter('date')(evtDetails.event_date, 'yyyy-MM-dd'),
                start_time: $filter('date')(evtDetails.start_time, 'HH:mm:00'),
                end_time: $filter('date')(evtDetails.end_time, 'HH:mm:00'),
                description: evtDetails.description,
                address_1: evtDetails.address_1,
                address_2: evtDetails.address_2,
                county: evtDetails.county,
                town_city: evtDetails.town_city,
                post_code: evtDetails.post_code,
                event_gallery: $scope.eventGallery.join(',')
            }, 'addEditClubEvent').then(function (res) {
                $ionicLoading.hide();
                $scope.showSuccess('Successfully completed', 2000);

                var club_id = !$scope.clubEvent.club_id ? evtDetails.cluclub_id : $scope.clubEvent.club_id;
                $scope.viewClubDetails(club_id);

                setTimeout(
                    function () {
                        $scope.closeModalCreateNewEvent();
                        $ionicScrollDelegate.resize();
                        $scope.$broadcast('scroll.refreshComplete');
                    }, 2000
                );


            }, function (x) {
                console.log(x);
                $scope.showError("Check your connection!");
            });

        }
    };

    $scope.viewClubDetails = function (club_id) {
        Data.send({
            api_key: api_key,
            club_id: club_id
        }, 'viewClubDetails').then(function (res) {

            $scope.clubDetails = res.group_details;
            $scope.clubDetails.clubLogo = res.group_details.img_url_pro + res.group_details.image;
            $scope.all_events = res.group_details.event_details;
            $scope.all_members = res.group_details.member_details;
            $scope.requested_members = res.group_details.requested_member_details;
            $scope.member_ads = res.member_ads;

            if (res.group_details.events_count > 3) {
                $scope.eventsMore = true;
                $scope.all_ev_start = 3;
                $scope.all_ev_limit = 3;

            } else {
                $scope.eventsMore = false;

            }

            if (res.group_details.members_count > 3) {
                $scope.membersMore = true;
                $scope.all_mem_start = 3;
                $scope.all_mem_limit = 3;

            } else {
                $scope.membersMore = false;

            }

            if (res.group_details.requested_members_count > 3) {
                $scope.requestedmembersMore = true;
                $scope.Rq_mem_start = 3;
                $scope.Rq_mem_limit = 3;

            } else {
                $scope.requestedmembersMore = false;

            }

            if (res.member_ads_count > 0) {
                $scope.adsMore = true;
                $scope.all_ad_start = 5;
                $scope.all_ad_limit = 5;

            } else {
                $scope.adsMore = false;

            }

            // $ionicSlideBoxDelegate.update();
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

//    $scope.club_connection_response = function (mem_id) {
//        console.log("response");
//
//        var confirmDiscon = $ionicPopup.confirm({
//            title: 'Request Confirmation',
//            template: '',
//            okText: 'Accept',
//            cancelText: 'Reject'
//        });
//        confirmDiscon.then(function (res) {
//            if (res) {
//                $scope.accept_reject_club_member('accept', mem_id);
//            } else {
//                $scope.accept_reject_club_member('reject', mem_id);
//            }
//        });
//        $timeout(function () {
//            confirmDiscon.close();
//        }, 1000000);
//
//    };

    $scope.club_connection_response = function (mem_id) {
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Accept'
            }, {
                text: '<span class="text-red"> Reject </span>'
            }],
            titleText: 'Club Request Confirmation',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    $scope.accept_reject_club_member('accept', mem_id);
                } else if (index == 1) {
                    $scope.accept_reject_club_member('reject', mem_id);
                }
                return true;
            }
        });
    };
    
    $scope.accept_reject_club_member = function (action, mem_id) {

        Data.send({
            api_key: api_key,
            club_id: club_id,
            member_id: mem_id,
            action: action
        }, 'acceptRejectGroupMember').then(function (res) {
            if (res.success == 1) {

                if(action == 'accept'){
                    $scope.result = 'Accepted';
                } else if(action == 'reject'){
                    $scope.result = 'Rejected';
                }

                var alertPopup = $ionicPopup.alert({
                    title: 'Member Successfully ' + $scope.result,
                    template: ''
                });

                $scope.viewClubDetails(club_id);
                $scope.loadClubMemberRequests();

            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.accept_reject_club_request = function (action) {

        Data.send({
            api_key: api_key,
            club_id: club_id,
            action: action
        }, 'acceptRejectGroupRequest').then(function (res) {
            if (res.success == 1) {

                if(action == 'accept'){
                    $scope.result = 'Accepted';
                } else if(action == 'reject'){
                    $scope.result = 'Rejected';
                }

                var alertPopup = $ionicPopup.alert({
                    title: 'Member Successfully ' + $scope.result,
                    template: ''
                });

                $scope.viewClubDetails(club_id);

            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.closeModal = function () {
        if ($scope.modalCreateNewEvent) {
            $scope.modalCreateNewEvent.hide();
        }
    };

    $scope.openModalCreateNewEvent = function (clubDetails) {
        $ionicModal.fromTemplateUrl('templates/modal/mdl_create_event.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalCreateNewEvent = modal;
            $scope.img = [];
            var now = new Date(), getHours = now.getHours();

            var startTime = getHours + 3;
            var endTime = getHours + 4;

            $scope.minDate = new Date();

            // $scope.todayDate = $filter('date')(new Date(), 'dd-MM-yyyy');

            $scope.minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
            
            $scope.minStartDate = new Date();

            $scope.clubEvent = {
                club_id: clubDetails.id,
                event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, now.getHours(), now.getMinutes()),
                // start_time: new Date (new Date().toDateString() + ' ' + startTime +':00'),
                // end_time: new Date (new Date().toDateString() + ' ' + endTime +':00'),
                start_time: new Date (new Date().toDateString() + ' ' + '06:30'),
                end_time: new Date (new Date().toDateString() + ' ' + '08:30'),
                town_city: clubDetails.town_id,
                town_name: clubDetails.town_name,
                county: clubDetails.county_name
            };
            $scope.modalCreateNewEvent.show();

            $scope.clubEventTitle = 'Add New Event';

            $scope.eventGallery = [];


        });
    };

    $scope.changeEventDate = function(event_date){
        $scope.minStartTime = event_date;
        $scope.minEndTime = event_date;

        var now = new Date(), getHours = now.getHours();

        var startTime = getHours + 3;
        var endTime = getHours + 4;

        $scope.clubEvent = {
            event_date: event_date,
            start_time: new Date (new Date(event_date).toDateString() + ' ' + startTime +':00'),
            end_time: new Date (new Date(event_date).toDateString() + ' ' + endTime +':00'),
        };
        

        console.log($scope.clubEvent);

    };

    $scope.changeEventStartTime = function(start_time){
        $scope.minEndTime = start_time;

    };

    $scope.closeModalCreateNewEvent = function () {
        $scope.modalCreateNewEvent.hide();
    };

    $ionicModal.fromTemplateUrl('templates/modal/mdl_all_club_requests.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalAllClubRequests = modal;
    });
    $scope.openModalAllClubRequests = function () {
        $scope.modalAllClubRequests.show();
        $scope.loadClubMemberRequests();
    };
    $scope.closeModalAllClubRequests = function () {
        $scope.modalAllClubRequests.hide();
    };

    $scope.loadClubMemberRequests = function(){
        Data.send({
            api_key: api_key,
            club_id: club_id
        }, 'getClubMemberRequests').then(function (res) {

            if(res.success == 1){

                $scope.users = JSON.parse(JSON.stringify(res)).users;
                if (JSON.parse(JSON.stringify(res)).users.length <= 0) {
                    $scope.have_users = true;
                } else {
                    $scope.have_users = false;
                }

            }

        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };


    $scope.showEventAction = function (event_id) {
        // var event_id = event_id;enable_subcat
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Edit'
            }, {
                text: '<span class="text-red"> Delete </span>'
            }],
            titleText: 'Event Option',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    $scope.openModalEditEvent(event_id);
                } else if (index == 1) {
                    $scope.deleteEvent(event_id);
                }
                return true;
            }
        });
    };
    
    $scope.deleteEvent = function (id) {
        var confirmPdel = $ionicPopup.confirm({
            title: 'Are you sure you want to delete this event?',
            template: ''
        });
        confirmPdel.then(function (res) {
            if (res) {
                $scope.confirmDeleteEvent(id, 1);
            } else {}
        });
        $timeout(function () {
            confirmPdel.close();
        }, 10000);
    };
    $scope.confirmDeleteEvent = function (id, password) {
        Data.send({
            api_key: api_key,
            event_id: id,
            password: password
        }, 'deleteClubEvent').then(function (res) {
            if ($scope.my_events != null) {
                angular.forEach($scope.my_events, function (value, key) {
                    if (id == $scope.my_events[key].id) {
                        $scope.my_events.splice(key, 1);
                    }
                });
            }
            $scope.viewClubDetails(club_id);
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.openModalEditEvent = function (id) {
        $ionicModal.fromTemplateUrl('templates/modal/mdl_create_event.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalCreateNewEvent = modal;

            $scope.clubEvent = {
                event_date: new Date()
            };
            $scope.eventGallery = [];
            $scope.img = [];
            $scope.modalCreateNewEvent.show();

            $scope.clubEventTitle = 'Edit Event';
            Data.send({
                api_key: api_key,
                event_id: id
            }, 'getEventDetailsForEdit').then(function (res) {
                console.log(res);
                let eventForEdit = JSON.parse(JSON.stringify(res)).event_details;
                if (typeof eventForEdit == 'object') {

                    let evtEndTime = new Date();
                    let hms = (eventForEdit.end_time).split(':');
                    evtEndTime.setMinutes(hms[1]);
                    evtEndTime.setSeconds('00');
                    evtEndTime.setHours(hms[0]);
                    evtEndTime.setMilliseconds(0);
                    let evtStartTime = new Date();
                    hms = (eventForEdit.start_time).split(':');
                    evtStartTime.setMinutes(hms[1]);
                    evtStartTime.setSeconds('00');
                    evtStartTime.setHours(hms[0]);
                    evtStartTime.setMilliseconds(0);
                    $scope.clubEvent.event_id = eventForEdit.id;
                    $scope.clubEvent.title = eventForEdit.title;
                    $scope.clubEvent.venue = eventForEdit.venue;
                    $scope.clubEvent.event_date = new Date(eventForEdit.event_date);
                    $scope.clubEvent.club_id = eventForEdit.club_id;
                    $scope.clubEvent.start_time = evtStartTime;
                    $scope.clubEvent.end_time = evtEndTime;
                    $scope.clubEvent.address_1 = eventForEdit.address_1;
                    $scope.clubEvent.address_2 = eventForEdit.address_2;
                    $scope.clubEvent.town_city = eventForEdit.town_city;
                    $scope.clubEvent.county = eventForEdit.county;
                    $scope.clubEvent.town_name = eventForEdit.town_name;
                    $scope.clubEvent.post_code = eventForEdit.postcode;
                    $scope.clubEvent.description = eventForEdit.description;
                    $scope.navigate_from = 'club_view';
                    let event_galleryImages = (eventForEdit.image_id) ? eventForEdit.image_id : [];

                    event_galleryImages.forEach(function (value, key) {
                        $scope.eventGallery.push(value['file_id']);
                        $scope.img.push(value['file_name']);
                    });

                } else {
                    console.log(eventForEdit);
                }

            }, function (x) {
                $scope.showError("Check your connection!");
            });

        });
    };

    $scope.changeEventDate = function(set_date){
        $scope.minStartDate = set_date;

    };

    $scope.changeEventStartTime = function(start_time){
        $scope.minEndDate = start_time;

    };

    $scope.facebookShareEvents = function (event_id) {
        var url = 'https://www.thebusinessclub.com/view_more_event_details?id=' + event_id;
        window.plugins.socialsharing.shareViaFacebook(null, null /* img */ , url, null, function (errormsg) {
            // window.open('https://www.facebook.com/sharer.php?s=100&&p[caption]=dasads&p[url]='.url, '_system');
        }, function (err) {
            $scope.showError("You have to install facebook!");
        });
    };
    $scope.facebookShareEventstmp = function (event_id) {
        var url = 'https://www.thebusinessclub.com/view_more_event_details?id=' + event_id;
        window.plugins.socialsharing.shareViaFacebook('Message via Facebook', 'http://www.flooringvillage.co.uk/ekmps/shops/flooringvillage/images/request-a-sample--547-p.jpg', null /* url */ , function () {
            // alert.log('share ok');
        }, function (errormsg) {
            // alert(errormsg);
        });
    };
    $scope.twitterShareEvents = function (event_id) {
        var url = 'https://www.thebusinessclub.com/view_more_event_details?id=' + event_id;
        var share_url = 'https://twitter.com/share?url=' + url;
        window.plugins.socialsharing.shareViaTwitter(null, null /* img */ , url, null, function (errormsg) {
            window.open(share_url, '_system');
        });
    };
    $scope.whatsappShareEvents = function (event_id) {
        var url = 'https://www.thebusinessclub.com/view_more_event_details?id=' + event_id;
        window.plugins.socialsharing.shareViaWhatsApp(null, null /* img */ , url, null, function (errormsg) {
            // alert("Error: Cannot Share");
            $scope.showError("Cannot share. Please try again later!");
        });
    };
    $scope.sendSMSEvents= function (event_id) {
        var url = 'https://www.thebusinessclub.com/view_more_event_details?id=' + event_id;
        window.plugins.socialsharing.shareViaSMS(url);
    };
    $scope.moreShocialShareEvents = function (event_id, title, location, img) {
        var url = 'https://www.thebusinessclub.com/view_more_event_details?id=' + event_id;
        $ionicLoading.show();
        window.plugins.socialsharing.share(title, null, null, url, function (success) {
            $ionicLoading.hide();
        }, function (error) {
            $ionicLoading.hide();
            $scope.showSuccess(error);
        });
    };

    ionic.material.ink.displayEffect();

});

app.controller('SingleEventCtrl', function ($scope, $controller, $cordovaFile, $ionicLoading, $cordovaCamera, $ionicScrollDelegate, Data, TbcAuthService, $rootScope, $ionicModal, $ionicPopup, $stateParams, $state, $ionicSlideBoxDelegate) {
    api_key = window.localStorage.getItem('userkey');
    // $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    //     viewData.enableBack = false;
    // });
    $ionicLoading.show();

    var event_id = $stateParams.id;
 
    $scope.viewEventImage = function (adImage) {

        var wllImg = '<ion-scroll overflow-scroll="false" zooming="true" direction="xy" ><img src="' + adImage + '"></ion-scroll>';

        var alertPopup = $ionicPopup.alert({
            template: wllImg,
            cssClass: 'event-Image-PopUp',
            buttons: [{
                text: 'Cancel',
                type: 'button-clear'
            }]
        });
    };

    $scope.readNotifications = function (type, id) {
        Data.send({
            api_key: api_key,
            type: type,
            id: id
        }, 'userNotificationUpdate').then(function (res) {}, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    
    $scope.viewEventDetails = function () {
        Data.send({
            api_key: api_key,
            event_id: event_id
        }, 'viewEventDetails').then(function (res) {

            if ($stateParams.navigate_from == "notifications") {
                $scope.readNotifications($stateParams.not_type, $stateParams.readid);
            }

            $scope.eventDetails = res.event_details;
            $scope.clubDetails = res.event_details.group_details[0];

            $scope.mapStatus = false;
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({
                'address': $scope.eventDetails.postcode
            }, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    $scope.lat = results[0].geometry.location.lat();
                    $scope.lng = results[0].geometry.location.lng();
                    $scope.mapStatus = true;
                } else {
                    $scope.mapStatus = false;
                }
            });

            $ionicSlideBoxDelegate.update();
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.clickAttendanceBtn = function (attendance_type, type_status) {
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            event_id: event_id,
            attendance_type: attendance_type,
            type_status: type_status
        }, 'changeAttendanceStatus').then(function (res) {

            $scope.viewEventDetails();
            // $ionicSlideBoxDelegate.update();
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $ionicModal.fromTemplateUrl('templates/modal/mdl_event_attendance_list.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalAttendingMembers = modal;
    });

    $scope.openModalAttendingMembers = function (attendance_type, event_id) {
        $scope.modalAttendingMembers.show();
        if(attendance_type == 'interested'){

            $scope.modalTitle = 'Interested Members';

        }else if(attendance_type == 'going'){

            $scope.modalTitle = 'Going Members';
        }
        $scope.loadAttendanceList(attendance_type, event_id);
        
    };
    $scope.closeModalAttendingMembers = function () {
        $scope.attendance_users = [];
        $scope.modalAttendingMembers.hide();
    };

    $scope.openFriendsProfile = function (friend_id) {
        $scope.closeModalAttendingMembers();
        
        $state.go('app.friends_profile', {
            friendid: friend_id
        });
    };

    $scope.loadAttendanceList = function(attendance_type, event_id){
        Data.send({
            api_key: api_key,
            attendance_type: attendance_type,
            event_id: event_id
        }, 'getattendanceMembersForEvent').then(function (res) {

            if(res.success == 1){

                $scope.attendance_users = JSON.parse(JSON.stringify(res)).users;

                if (JSON.parse(JSON.stringify(res)).users.length > 0) {
                    $scope.have_users = true;
                } else {
                    $scope.have_users = false;
                }
            }

        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.openFriendsProfile = function (friend_id) {
        $scope.closeModalAttendingMembers();
        
        $state.go('app.friends_profile', {
            friendid: friend_id
        });
    };

    $ionicModal.fromTemplateUrl('templates/modal/mdl_make_individual_events.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalMakeIndividualEvents = modal;
    });

    $scope.openModalMakeMeetings = function (member_id, member_name) {
        $scope.modalMakeIndividualEvents.show();

        $scope.member_id = member_id;
        $scope.member_name = member_name;
        
    };
    $scope.closeModalMakeMeetings = function () {
        $scope.modalMakeIndividualEvents.hide();
    };

    $scope.viewEventDetails();

    ionic.material.ink.displayEffect();

    $scope.joinClub = function (club_id) {
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            club_id: club_id
        }, 'userRequestJoinClub').then(function (res) {
            $ionicLoading.hide();
            if(res.success == 1){

                $scope.viewEventDetails(club_id);
                $scope.showSuccess('Join Request Sent Successfully');

            }

        }, function (x) {
            $scope.showError("Check your connection!");
        });

    };

    $scope.cancelClubRequest = function (club_id) {
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            club_id: club_id
        }, 'cancelClubRequest').then(function (res) {
            $ionicLoading.hide();
            if(res.success == 1){

                $scope.viewEventDetails(club_id);
                $scope.showSuccess('Club Request Cancelled Successfully');

            }

        }, function (x) {
            $scope.showError("Check your connection!");
        });

    };

    $scope.accept_reject_club_request = function (action, club_id) {

        Data.send({
            api_key: api_key,
            club_id: club_id,
            action: action
        }, 'acceptRejectGroupRequest').then(function (res) {
            if (res.success == 1) {

                if(action == 'accept'){
                    $scope.result = 'Accepted';
                } else if(action == 'reject'){
                    $scope.result = 'Rejected';
                }

                var alertPopup = $ionicPopup.alert({
                    title: 'Member Successfully ' + $scope.result,
                    template: ''
                });

                $scope.viewEventDetails(club_id);

            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };



































});

app.controller('ClubEventsCtrl', function ($scope, $cordovaFileTransfer, $ionicLoading, Data, TBC, TbcAuthService, $ionicScrollDelegate, $ionicModal, $filter, $ionicActionSheet, $ionicPopup, $timeout) {
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = false;
    });
    api_key = window.localStorage.getItem('userkey');
    var images = [];
    $scope.serverImage = [];
    var loadSize = 0;
    $scope.img = images;
    $scope.event_galleryImages = [];
    var incre = 0;
    $scope.event_name = "All";
    $scope.county = "All";
    $scope.town_id = "All";
    $scope.var5 = 1;
    $scope.towns = [];
    $scope.filterEvents = 'false';

    $scope.eventSearch = '';


    $scope.getEventSearch = function (search, var5) {

        $scope.eventSearch = search;

        if (var5 == 1) {
            $scope.getMyEvents();
        }

        if (var5 == 2) {
            $scope.getMyExpiredEvents();
        }

        if (var5 == 3) {
            $scope.AllEvents();
        }

    };

    $scope.TabChangeEventList = function (num) {
        $scope.var5 = num;
        $scope.filterEvents = 'false';
        if (num == 3) {
            $scope.county = "All";
            $scope.town_id = "All";
        }
    };
    $scope.AllEvents = function () {
        $scope.events = [];
        $scope.county = "All";
        $scope.town_id = "All";
        $scope.all_ev_start = 0;
        $scope.all_ev_limit = 10;
        //$scope.adSearch='';
        Data.send({
            api_key: api_key,
            start: $scope.all_ev_start,
            count: $scope.all_ev_limit,
            county: 'All',
            town: 'All',
            search: $scope.eventSearch
        }, 'allClubEvents').then(function (resData) {
            $scope.all_events = JSON.parse(JSON.stringify(resData)).all_events;
            if (JSON.parse(JSON.stringify(resData)).all_events_count > 10) {
                $scope.all_ev_start = 10;
                $scope.all_ev_limit = 10;
                $scope.eventsMore = false;
            } else {
                $scope.eventsMore = true;
            }
            $scope.all_events_count = JSON.parse(JSON.stringify(resData)).all_events_count;
            $ionicLoading.hide();
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.getAllEventsMore = function (county, town_id) {
        Data.send({
            start: $scope.all_ev_start,
            count: $scope.all_ev_limit,
            county: county,
            town: town_id,
            search: $scope.eventSearch
        }, 'allClubEvents').then(function (res) {
            $scope.len = JSON.parse(JSON.stringify(res)).all_events;
            if (county == "All" && town_id == "All") {
                $scope.all_events = $scope.all_events.concat(JSON.parse(JSON.stringify(res)).all_events);
                $scope.all_events_count = JSON.parse(JSON.stringify(res)).all_events_count;
            } else if (county != "All" || town_id != "All") {
                $scope.search_events = $scope.search_events.concat(JSON.parse(JSON.stringify(res)).all_events);
                $scope.search_events_count = JSON.parse(JSON.stringify(res)).all_events_count;
            }
            $scope.all_ev_start = $scope.all_ev_start + 10;
            $scope.all_ev_limit = 10;
            if ($scope.all_events.length > JSON.parse(JSON.stringify(res)).all_events_count) {
                $scope.eventsMore = true;
            } else {
                $scope.eventsMore = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    var myex_start = 0,
        myex_count = 10;
    $scope.myexMore = false;

    $scope.getMyExpiredEvents = function () {
        $scope.filterEvents = 'false';
        myex_start = 0;
        myex_count = 10;
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            start: myex_start,
            count: myex_count,
            search: $scope.eventSearch
        }, 'myExpiredClubEvents').then(function (resData) {

            $scope.have_group = resData.have_group;
            $scope.clubDetails = resData.group_details;
            
            if (JSON.parse(JSON.stringify(resData)).my_expired_events_count > 0) {
                $scope.have_events = true;

                $scope.my_expired_events = JSON.parse(JSON.stringify(resData)).my_expired_events;

                if (resData.my_expired_events_count > 10) {
                    $scope.myexMore = true;
                }

            } else {
                $scope.have_events = false;
                $scope.my_expired_events_count = 0;
                $scope.my_expired_events = [];
            }
            $ionicLoading.hide();
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };


    $scope.getMyExpiredEventsMore = function () {
        myex_start = myex_start + myex_count;
        myex_count = 10;
        //$ionicLoading.show();
        Data.send({
            api_key: api_key,
            start: myex_start,
            count: myex_count,
            search: $scope.eventSearch
        }, 'myExpiredClubEvents').then(function (resData) {

            $scope.have_group = resData.have_group;
            $scope.clubDetails = resData.group_details;

            if (JSON.parse(JSON.stringify(resData)).my_expired_events_count > 0) {
                $scope.have_events = true;

                $scope.my_expired_events = $scope.my_expired_events.concat(JSON.parse(JSON.stringify(resData)).my_expired_events);
                if ($scope.my_expired_events.length >= resData.my_expired_events_count) {
                    $scope.myexMore = false;
                } else {
                    $scope.myexMore = true;
                }

            } else {

            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    var myevent_start = 0,
        myevent_limit = 10;
    $scope.myevent_more = false;
    $scope.getMyEvents = function () {
        myevent_start = 0, myevent_limit = 10;
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            start: myevent_start,
            count: myevent_limit,
            search: $scope.eventSearch
        }, 'myClubEvents').then(function (res) {

            $scope.have_group = res.have_group;
            $scope.clubDetails = res.group_details;

            if (JSON.parse(JSON.stringify(res)).success > 0) {
                $scope.my_events = JSON.parse(JSON.stringify(res)).my_events;
                $scope.have_events = true;
                if (res.my_events_count > 10) {
                    $scope.myevent_more = true;
                }
            } else {
                $scope.have_events = false;
                $scope.my_events = [];
                $scope.myevent_more = false;
            }
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.getMyEventsMore = function () {
        myevent_start = myevent_start + 10, myevent_start = 10;
        Data.send({
            api_key: api_key,
            start: myevent_start,
            count: myevent_start,
            search: $scope.eventSearch
        }, 'myClubEvents').then(function (res) {

            $scope.have_group = res.have_group;
            $scope.clubDetails = res.group_details;

            if (JSON.parse(JSON.stringify(res)).success > 0) {
                $scope.my_events = $scope.my_events.concat(JSON.parse(JSON.stringify(res)).my_events);
                if ($scope.my_events.length >= res.my_events_count) {
                    $scope.myevent_more = false;
                } else {
                    $scope.myevent_more = true;
                }
            } else {
                $scope.have_events = false;
                $scope.my_events = [];
                $scope.myevent_more = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.getMyEvents();
    $scope.getMyExpiredEvents();
    $scope.AllEvents();

    $scope.eventsRefresh = function (var5) {
        if (var5 == 1) {
            $scope.getMyEvents();
        }
        if (var5 == 2) {
            $scope.getMyExpiredEvents();
        }
        if (var5 == 3) {
            $scope.AllEvents();
        }
    };


    if (api_key == null) {
        $scope.var5 = 2;
        $scope.eventsRefresh(2);
    } else {
        $scope.var5 = 1;
    }

    $scope.goToAllEvents = function () {
        $scope.county = "All";
        $scope.town_id = "All";
    };
    $scope.openFilterAllEvents = function () {
        $ionicLoading.show();
        $ionicModal.fromTemplateUrl('templates/modal/filter_event.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            Data.send({
                api_key: api_key,
                start: 0,
                count: 10
            }, 'getCounties').then(function (res) {
                $scope.counties = JSON.parse(JSON.stringify(res)).counties;
                if (JSON.parse(JSON.stringify(res)).counties.length <= 0) {
                    $scope.enable_town = false;
                } else {
                    $scope.enable_town = true;
                }

                $scope.modalFilter = modal;
                $scope.modalFilter.show();
                $ionicLoading.hide();

            }, function (x) {
                $scope.showError("Check your connection!");
            });
        });
    };
    $scope.closeFilter = function () {
        $scope.modalFilter.hide();
    };
    $scope.getTown = function (county) {
        Data.send({
            county_id: county
        }, 'getTowns').then(function (res) {
            $scope.towns = JSON.parse(JSON.stringify(res)).towns;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.FilterEvents = function (location) {
        $ionicLoading.show();
        $scope.all_ev_start = 0;
        $scope.all_ev_limit = 10;
        $scope.filterEvents = 'true';
        if (location) {
            if (location.county_id) {
                $county_name = location.county_id;
                $scope.county = location.county_id;
            } else {
                $county_name = "All";
                $scope.county = "All";
            }
            if (location.town_id) {
                $town_id = location.town_id;
                $scope.town_id = location.town_id;
            } else {
                $town_id = "All";
                $scope.town_id = "All";
            }
        } else {
            $county_name = "All";
            $town_id = "All";
            $scope.county = "All";
            $scope.town_id = "All";
        }
        if ($county_name == "All") {
            $town_id = "All";
            $scope.town_id = "All";
        }
        Data.send({
            start: $scope.all_ev_start,
            count: $scope.all_ev_limit,
            county: $county_name,
            town: $town_id,
            search: null
        }, 'allClubEvents').then(function (res) {
            if (JSON.parse(JSON.stringify(res)).products_count > 10) {
                $scope.eventsMore = false;
                $scope.all_ev_start = 10;
                $scope.all_ev_limit = 10;
            } else {
                $scope.eventsMore = true;
            }
            $ionicLoading.hide();
            $scope.closeFilter();

            $scope.search_events = JSON.parse(JSON.stringify(res)).all_events;
            $scope.search_events_count = JSON.parse(JSON.stringify(res)).all_events_count;

            console.log($scope.county);
            console.log($scope.town_id);
            console.log($scope.search_events);

        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };


    $scope.showEventAction = function (event_id, navigate_from) {
        // var event_id = event_id;enable_subcat
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Edit'
            }, {
                text: '<span class="text-red"> Delete </span>'
            }],
            titleText: 'Event Option',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    $scope.openModalEditEvent(event_id);
                } else if (index == 1) {
                    $scope.deleteEvent(event_id, navigate_from);
                }
                return true;
            }
        });
    };
    
    $scope.deleteEvent = function (id, navigate_from) {
        var confirmPdel = $ionicPopup.confirm({
            title: 'Are you sure you want to delete this event?',
            template: ''
        });
        confirmPdel.then(function (res) {
            if (res) {
                $scope.confirmDeleteEvent(id, 1, navigate_from);
            } else {}
        });
        $timeout(function () {
            confirmPdel.close();
        }, 10000);
    };
    $scope.confirmDeleteEvent = function (id, password, navigate_from) {
        Data.send({
            api_key: api_key,
            event_id: id,
            password: password
        }, 'deleteClubEvent').then(function (res) {

            if(navigate_from == 'my_events'){

                if ($scope.my_events != null) {
                    angular.forEach($scope.my_events, function (value, key) {
                        if (id == $scope.my_events[key].id) {
                            $scope.my_events.splice(key, 1);
                        }
                    });
                }
                $scope.getMyEvents();

            }else if(navigate_from == 'expired_events'){

                if ($scope.my_expired_events != null) {
                    angular.forEach($scope.my_expired_events, function (value, key) {
                        if (id == $scope.my_expired_events[key].id) {
                            $scope.my_expired_events.splice(key, 1);
                        }
                    });
                }
                $scope.getMyExpiredEvents();

            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };




    $scope.openModalCreateNewEvent = function (clubDetails) {
        $ionicModal.fromTemplateUrl('templates/modal/mdl_create_event.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalCreateNewEvent = modal;
            $scope.img = [];
            var now = new Date(), getHours = now.getHours();

            var startTime = getHours + 3;
            var endTime = getHours + 4;

            // $scope.todayDate = $filter('date')(new Date(), 'dd-MM-yyyy');

            $scope.minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
            $scope.minStartDate = new Date();

            console.log($scope.minDate);

            $scope.clubEvent = {
                club_id: clubDetails.id,
                event_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, now.getHours(), now.getMinutes()),
                // start_time: new Date (new Date().toDateString() + ' ' + startTime +':00'),
                // end_time: new Date (new Date().toDateString() + ' ' + endTime +':00'),
                start_time: new Date (new Date().toDateString() + ' ' + '06:30'),
                end_time: new Date (new Date().toDateString() + ' ' + '08:30'),
                town_city: clubDetails.town_id,
                town_name: clubDetails.town_name,
                county: clubDetails.county_name
            };
            $scope.modalCreateNewEvent.show();

            $scope.clubEventTitle = 'Add New Event';

            $scope.eventGallery = [];


        });
    };

    $scope.changeEventDate = function(event_date){
        $scope.minStartTime = event_date;
        $scope.minEndTime = event_date;

        // var now = new Date(), getHours = now.getHours();

        // var startTime = getHours + 3;
        // var endTime = getHours + 4;

        // $scope.clubEvent = {
        //     event_date: event_date,
        //     start_time: new Date (new Date(event_date).toDateString() + ' ' + startTime +':00'),
        //     end_time: new Date (new Date(event_date).toDateString() + ' ' + endTime +':00'),
        // };
        

        console.log($scope.clubEvent);

    };

    $scope.changeEventStartTime = function(start_time){
        $scope.minEndTime = start_time;

    };

    $scope.closeModalCreateNewEvent = function () {
        $scope.modalCreateNewEvent.hide();
    };

    // from events
    $scope.addClubEvent = function (evtDetails) {

        $ionicLoading.show();
        var messgePop = '';
        if (evtDetails.title == undefined || evtDetails.venue == '' || evtDetails.event_date == '') {
            messgePop = "Please fill all event details";
            $scope.showError(messgePop, 2000);
        } else {
            Data.send({
                api_key: api_key,
                event_id: (!$scope.clubEvent.event_id) ? 'undefined' : $scope.clubEvent.event_id,
                club_id: !$scope.clubEvent.club_id ? evtDetails.cluclub_id : $scope.clubEvent.club_id,
                title: evtDetails.title,
                venue: evtDetails.venue,
                event_date: $filter('date')(evtDetails.event_date, 'yyyy-MM-dd'),
                start_time: $filter('date')(evtDetails.start_time, 'HH:mm:00'),
                end_time: $filter('date')(evtDetails.end_time, 'HH:mm:00'),
                description: evtDetails.description,
                address_1: evtDetails.address_1,
                address_2: evtDetails.address_2,
                county: evtDetails.county,
                town_city: evtDetails.town_city,
                post_code: evtDetails.post_code,
                event_gallery: $scope.eventGallery.join(',')
            }, 'addEditClubEvent').then(function (res) {
                $ionicLoading.hide();
                $scope.showSuccess('Successfully completed', 2000);
                setTimeout(
                    function () {

                        $scope.AllEvents();
                        $scope.getMyExpiredEvents();
                        $scope.getMyEvents();
                        
                        $scope.closeModal();
                        $ionicScrollDelegate.resize();
                        $scope.$broadcast('scroll.refreshComplete');
                    }, 2000
                );


            }, function (x) {
                console.log(x);
                $scope.showError("Check your connection!");
            });

        }
    };

    $scope.closeModal = function () {
        if ($scope.modalCreateNewEvent) {
            $scope.modalCreateNewEvent.hide();
        }
    };

    $scope.openModalEditEvent = function (id) {
        $ionicModal.fromTemplateUrl('templates/modal/mdl_create_event.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalCreateNewEvent = modal;

            $scope.clubEvent = {
                event_date: new Date()
            };
            $scope.eventGallery = [];
            $scope.img = [];
            $scope.modalCreateNewEvent.show();

            $scope.clubEventTitle = 'Edit Event';
            Data.send({
                api_key: api_key,
                event_id: id
            }, 'getEventDetailsForEdit').then(function (res) {
                console.log(res);
                let eventForEdit = JSON.parse(JSON.stringify(res)).event_details;
                if (typeof eventForEdit == 'object') {

                    let evtEndTime = new Date();
                    let hms = (eventForEdit.end_time).split(':');
                    evtEndTime.setMinutes(hms[1]);
                    evtEndTime.setSeconds('00');
                    evtEndTime.setHours(hms[0]);
                    evtEndTime.setMilliseconds(0);
                    let evtStartTime = new Date();
                    hms = (eventForEdit.start_time).split(':');
                    evtStartTime.setMinutes(hms[1]);
                    evtStartTime.setSeconds('00');
                    evtStartTime.setHours(hms[0]);
                    evtStartTime.setMilliseconds(0);
                    $scope.clubEvent.event_id = eventForEdit.id;
                    $scope.clubEvent.title = eventForEdit.title;
                    $scope.clubEvent.venue = eventForEdit.venue;
                    $scope.clubEvent.event_date = new Date(eventForEdit.event_date);
                    $scope.clubEvent.club_id = eventForEdit.club_id;
                    $scope.clubEvent.start_time = evtStartTime;
                    $scope.clubEvent.end_time = evtEndTime;
                    $scope.clubEvent.address_1 = eventForEdit.address_1;
                    $scope.clubEvent.address_2 = eventForEdit.address_2;
                    $scope.clubEvent.town_city = eventForEdit.town_city;
                    $scope.clubEvent.county = eventForEdit.county;
                    $scope.clubEvent.town_name = eventForEdit.town_name;
                    $scope.clubEvent.post_code = eventForEdit.postcode;
                    $scope.clubEvent.description = eventForEdit.description;
                    $scope.navigate_from = 'my_events';
                    let event_galleryImages = (eventForEdit.image_id) ? eventForEdit.image_id : [];

                    event_galleryImages.forEach(function (value, key) {
                        $scope.eventGallery.push(value['file_id']);
                        $scope.img.push(value['file_name']);
                    });
                } else {
                    console.log(eventForEdit);
                }

            }, function (x) {
                $scope.showError("Check your connection!");
            });

        });
    };

    $scope.changeEventDate = function(set_date){
        $scope.set_date = set_date;
        $scope.minStartDate = set_date;

    };

    $scope.changeEventStartTime = function(start_time){
        $scope.minEndDate = start_time;

    };

    $scope.selectClubImages = function (num, img_type) {
        TbcAuthService.getFileUploadPermission();
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Load from Library'
            }, {
                text: 'Use Camera'
            }],
            titleText: 'Select Image',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    document.addEventListener("deviceready", onDeviceReady, false);

                    function onDeviceReady() {
                        window.imagePicker.getPictures(function (results) {
                            for (var i = 0; i < results.length; i++) {
                                //$scope.img.push(results[i]);
                                $scope.uploadClubGalleryImage(results[i], img_type);
                            }
                        }, function (error) {
                            console.log('Error: ' + error);
                        }, {
                            maximumImagesCount: num,
                            quality: 60
                        });
                    }
                } else if (index == 1) {
                    document.addEventListener("deviceready", onDeviceReady, false);

                    function onDeviceReady() {
                        var cameraOptions = {
                            quality: 60,
                            destinationType: Camera.DestinationType.FILE_URI,
                            encodingType: Camera.EncodingType.JPEG,
                            mediaType: Camera.MediaType.PICTURE,
                            allowEdit: true
                        };
                        navigator.camera.getPicture(function (success) {
                            //$scope.img.push(success);
                            $scope.uploadClubGalleryImage(success, img_type);
                        }, function (error) {
                            // $scope.showError('Check your camera option');
                        }, cameraOptions);
                    }
                }

                return true;
            }
        });
    };





    $scope.uploadClubGalleryImage = function (img, img_type) {
        $ionicLoading.show();
        var file_ids = [];

        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            var options = new FileUploadOptions();
            options.fileKey = "uploadfile";
            options.fileName = img.substr(img.lastIndexOf('/') + 1);
            options.mimeType = "image/jpeg";
            var params = new Object();
            params.api_key = api_key;
            params.src = img_type;
            options.params = params;
            options.chunkedMode = false;
            $cordovaFileTransfer.upload(encodeURI(TBC.URL + 'imageUploadToServer'), img, options).then(function (r) {
                var res = JSON.parse(r.response);
                console.log(res);
                if (res.file_id) {
                    $scope[img_type].push(res.file_id);
                    $scope.img.push(res.file_location);
                }
                $ionicLoading.hide();

            }, function (err) {
                console.log(err);
                $ionicLoading.hide();
            }, function (progress) {
                if (progress.lengthComputable) {

                } else {}
                $ionicLoading.hide();
            });

        }
    };
    $scope.removeSelectedImage = function (index, img_type) {
        if (!isNaN(index)) {
            $scope[img_type].splice(index, 1);
            $scope.img.splice(index, 1);
        }
    };
    $scope.removeUploadImage = function (item) {
        var index = $scope.img.indexOf(item);
        $scope.img.splice(index, 1);
    };

    $scope.facebookShareEvents = function (event_id) {
        var url = 'https://www.thebusinessclub.com/view_more_event_details?id=' + event_id;
        window.plugins.socialsharing.shareViaFacebook(null, null /* img */ , url, null, function (errormsg) {
            // window.open('https://www.facebook.com/sharer.php?s=100&&p[caption]=dasads&p[url]='.url, '_system');
        }, function (err) {
            $scope.showError("You have to install facebook!");
        });
    };
    $scope.facebookShareEventstmp = function (event_id) {
        var url = 'https://www.thebusinessclub.com/view_more_event_details?id=' + event_id;
        window.plugins.socialsharing.shareViaFacebook('Message via Facebook', 'http://www.flooringvillage.co.uk/ekmps/shops/flooringvillage/images/request-a-sample--547-p.jpg', null /* url */ , function () {
            // alert.log('share ok');
        }, function (errormsg) {
            // alert(errormsg);
        });
    };
    $scope.twitterShareEvents = function (event_id) {
        var url = 'https://www.thebusinessclub.com/view_more_event_details?id=' + event_id;
        var share_url = 'https://twitter.com/share?url=' + url;
        window.plugins.socialsharing.shareViaTwitter(null, null /* img */ , url, null, function (errormsg) {
            window.open(share_url, '_system');
        });
    };
    $scope.whatsappShareEvents = function (event_id) {
        var url = 'https://www.thebusinessclub.com/view_more_event_details?id=' + event_id;
        window.plugins.socialsharing.shareViaWhatsApp(null, null /* img */ , url, null, function (errormsg) {
            $scope.showError("Cannot Share. Please try again later!");
        });
    };
    $scope.sendSMSEvents= function (event_id) {
        var url = 'https://www.thebusinessclub.com/view_more_event_details?id=' + event_id;
        window.plugins.socialsharing.shareViaSMS(url);
    };
    $scope.moreShocialShareEvents = function (event_id, title, location, img) {
        var url = 'https://www.thebusinessclub.com/view_more_event_details?id=' + event_id;
        $ionicLoading.show();
        window.plugins.socialsharing.share(title, null, null, url, function (success) {
            $ionicLoading.hide();
        }, function (error) {
            $ionicLoading.hide();
            $scope.showSuccess(error);
        });
    };

    ionic.material.ink.displayEffect();
});

app.controller('PostCtrl', function ($scope, $rootScope, $controller, $ionicScrollDelegate, $ionicPopup, $ionicActionSheet, $ionicLoading, $ionicSlideBoxDelegate, $stateParams, Data, TbcAuthService, $parse) {
    /** 
     * Sigle Post Configurations templates/post.html
     * ===============================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer    : Mohamed Rimsan - rimsnet@gmail.com
     * Controller   : PostCtrl
     * Main Method  : app.controller('PostCtrl',function(......){});
     * Reuse Method : -
     * Scope Method :              
     * Date         : 2017-04-20
     * ===============================================================
     * */
    api_key = window.localStorage.getItem('userkey');
    $controller('ReuseWallCtrl', {
        $scope: $scope
    });
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = true;
    });
    $ionicLoading.show();
    $scope.doRefresh = function () {
        var id = $stateParams.postid;
        Data.send({
            api_key: api_key,
            wall_id: id
        }, 'singleWallbeta').then(function (res) {
            $scope.image_location_post = res.image_location_post;
            $scope.image_location_user = res.image_location_user;
            $rootScope.single_post = res.wall_posts;

            url = res.wall_posts.post_post;

            var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
            var result = url.replace(urlRegEx, "<a ng-click=\"directToPostLink('$1',\'_system\')\">$1</a>");

            $scope.name = result;

            if ($stateParams.navigate_from == "notifications") {
                $scope.readNotifications($stateParams.not_type, $stateParams.readid);
            }
            $ionicScrollDelegate.resize();
            $ionicSlideBoxDelegate.update();
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.directToPostLink = function (url) {

        //console.log('url ' + url);

        window.open(url, '_system');
    }

    $scope.doRefresh();
    $scope.wallImagePopUp = function (url, wallViewImage) {
        var alertPopup = $ionicPopup.alert({
            template: '<ion-scroll overflow-scroll="false" zooming="true" direction="xy" ><img src="' + url + wallViewImage + '"></ion-scroll>',
            cssClass: 'wall-Image-PopUp',
            buttons: [{
                text: 'Cancel',
                type: 'button-clear'
            }]
        });
    };
    $scope.$on("$ionicParentView.leave", function (event, data) {
        var deregister = $rootScope.$on('single_post', function (event) {});
        $scope.$on('$destroy', deregister);
    });
    $scope.openPopoverEditComment = function ($event, type, id, wall_id) {
        $ionicActionSheet.show({
            titleText: 'Comment Action',
            buttons: [{
                text: 'Edit'
            }],
            destructiveText: 'Delete',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    $ionicLoading.show();
                    $scope.data = {};
                    Data.send({
                        api_key: api_key,
                        reply_id: id
                    }, 'getSingleReply').then(function (res) {
                        var comm = res.reply_list;
                        $scope.data.comment = comm.comments;
                        var myPopup = $ionicPopup.show({
                            template: '<textarea ng-model="data.comment">' + comm.comments + '</textarea>',
                            title: 'Edit Comment',
                            scope: $scope,
                            buttons: [{
                                text: 'Cancel'
                            }, {
                                text: 'Save',
                                type: 'button-positive',
                                onTap: function (e) {
                                    if (!$scope.data.comment) {
                                        e.preventDefault();
                                    } else {
                                        return $scope.data.comment;
                                    }
                                }
                            }]
                        });
                        myPopup.then(function (res) {
                            if (res != undefined) {
                                if ($rootScope.single_post != null) {
                                    angular.forEach($rootScope.single_post.reply_message, function (value, key) {
                                        if (id == $rootScope.single_post.reply_message[key].id) {
                                            $rootScope.single_post.reply_message[key].reply = res;
                                        }
                                    });
                                }
                                Data.send({
                                    api_key: api_key,
                                    comment: res,
                                    reply_id: id
                                }, 'editWallPostReply').then(function (ress) {
                                    $scope.showSuccess('comment edited');
                                }, function (x) {
                                    $scope.showError("Check your connection!");
                                });
                            }
                        });
                        $ionicLoading.hide();
                        $scope.$broadcast('scroll.refreshComplete');
                    }, function (x) {
                        $scope.showError("Check your connection!");
                    });
                }
                return true;
            },
            destructiveButtonClicked: function () {
                if (id != undefined) {
                    if ($rootScope.single_post != null) {
                        angular.forEach($rootScope.single_post.reply_message, function (value, key) {
                            if (id == $rootScope.single_post.reply_message[key].id) {
                                $rootScope.single_post.reply_message.splice(key, 1);
                                if ($rootScope.single_post != null) {
                                    $rootScope.single_post.no_of_reply--;
                                    if ($rootScope.single_post.no_of_reply > 1) {
                                        $rootScope.single_post.comment = "comments";
                                    } else {
                                        $rootScope.single_post.comment = "comment";
                                    }
                                }
                                if ($rootScope.main_wall != null) {
                                    angular.forEach($rootScope.main_wall, function (value, key) {
                                        if (wall_id == $rootScope.main_wall[key].wall_post_id) {
                                            $rootScope.main_wall[key].no_of_reply--;
                                            if ($rootScope.main_wall[key].no_of_reply > 1) {
                                                $rootScope.main_wall[key].comment = "comments";
                                            } else {
                                                $rootScope.main_wall[key].comment = "comment";
                                            }
                                        }
                                    });
                                }
                                Data.send({
                                    api_key: api_key,
                                    reply_id: id
                                }, 'deleteWallPostReply').then(function (ress) {
                                    $scope.showSuccess('successfully deleted');
                                }, function (x) {
                                    $scope.showError("Check your connection!");
                                });
                            }
                        });
                    }
                }
                return true;
            }
        });
    };

    $scope.checkForExternalLinks = function (content, id) {

        var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
        var result = content.replace(urlRegEx, "<a ng-click=\"directToPostLink('$1',\'_system\')\">$1</a>");

        // var post_content = 'post_content' + wall_post_id;

        var the_string = 'reply'+id;
        var model = $parse(the_string);
        model.assign($scope, result)

        $ionicScrollDelegate.resize();
        $ionicSlideBoxDelegate.update();
        $scope.$broadcast('scroll.refreshComplete');

    };

    $scope.directToPostLink = function (url) {

        window.open(url, '_system');
    };

    ionic.material.ink.displayEffect();
});
app.controller('FriendCtrl', function ($scope, TBC, TbcAuthService, $ionicHistory, $controller, $ionicScrollDelegate, $timeout, $ionicPopup, $ionicModal, $rootScope, $ionicLoading, $ionicSlideBoxDelegate, $stateParams, Data) {
    $controller('ReuseWallCtrl', {
        $scope: $scope
    });
    $ionicLoading.show();
    api_key = window.localStorage.getItem('userkey');
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = true;
    });
    var id = $stateParams.friendid;
    $scope.vars = 1;
    $scope.clicked = function (num) {
        $scope.vars = num;
    };

    $scope.openSocialMediaLinks = function (link) {

        window.open(link, '_system');
    };

    $scope.callFriend = function (number) {

        window.plugins.CallNumber.callNumber(function () {}, function () {}, number);
        
    };

    $scope.tbcSocialShareAds = function (type, id, name) {
        function generateRandom(min, max) {
            var num = Math.floor(Math.random() * (max - min + 1)) + min;
            return (num === 8 || num === 15) ? generateRandom(min, max) : num;
        }
        var random = generateRandom(111111, 999999);
        var gen_pro_id = random + id + random;
        var url = TBC.WEB + 'order/' + gen_pro_id;
        if (type === 'facebook') {
            window.plugins.socialsharing.shareViaFacebook(null, null /* img */ , url, null, function (errormsg) {
                // window.open('https://www.facebook.com/sharer.php?s=100&&p[caption]=dasads&p[url]='.url, '_system');
            }, function (err) {
                $scope.showError("You have to install facebook!");
            });
        }
        if (type === 'twitter') {
            var share_url = 'https://twitter.com/share?url=' + url + '&text=' + name;
            window.plugins.socialsharing.shareViaTwitter(name + ' ', null /* img */ , url, null, function (errormsg) {
                window.open(share_url, '_system');
            });
        }
        if (type === 'whatsapp') {
            window.plugins.socialsharing.shareViaWhatsApp(null, null /* img */ , url, null, function (errormsg) {
                $scope.showError("Cannot Share. Please try again later!");
            });
        }
        if (type === 'sms') {
            window.plugins.socialsharing.shareViaSMS(url);
        }
        if (type === 'others') {
            $ionicLoading.show();
            window.plugins.socialsharing.share(name, null, null, url, function (success) {
                $ionicLoading.hide();
                if (success == true)
                    $scope.showSuccess('Successfully shared');
            }, function (error) {
                $ionicLoading.hide();
                $scope.showSuccess(error);
            });
        }
    };

    var friends_wall_start = 0;
    var friends_wall_limit = 5;
    $rootScope.viewFriendsProfile = function () {
        var id = $stateParams.friendid;
        Data.send({
            api_key: api_key,
            user_id: id
        }, 'friendProfile').then(function (res) {
            if (res.success == 1) {
                $scope.getFriendsProfileWall(id);
                $scope.friend = res.user;

                $scope.wall_show_status = true;
                if ($scope.friend.f_status == 'Connect') {
                    $scope.wall_show_status = false;
                } else if ($scope.friend.f_status == 'Accept/Reject') {
                    $scope.wall_show_status = false;
                } else if ($scope.friend.f_status == 'Request Sent') {
                    $scope.wall_show_status = false;
                }

                $scope.my_friends = res.my_friends;
                $scope.repost_this = 'user.' + res.user.id;
                $scope.user_id_profile = res.user.id;
                $scope.image_location_post = res.image_location_post;
                $scope.image_location_user = res.image_location_user;
                $scope.contact_name = res.user.contact_name;
                if (res.products.length > 0) {
                    $scope.have_products = true;
                    $scope.productss = res.products;
                } else {
                    $scope.have_products = false;
                }
                $scope.mapStatus = false;
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({
                    'address': $scope.friend.postcode
                }, function (results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        $scope.lat = results[0].geometry.location.lat();
                        $scope.lng = results[0].geometry.location.lng();
                        $scope.mapStatus = true;
                    } else {
                        $scope.mapStatus = false;
                    }
                });
            } else {
                $scope.showError('User not found');
                $ionicHistory.goBack();
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $rootScope.viewFriendsProfile();
    $scope.getFriendsProfileWall = function (friendid) {
        friends_wall_start = 0;
        friends_wall_limit = 5;
        Data.send({
            api_key: api_key,
            user_id: friendid,
            start: friends_wall_start,
            count: friends_wall_limit
        }, 'friendWallLoadMore').then(function (res) {
            if (res.total_wall_post > 5) {
                $scope.noMoreFriendsWallItemsAvailable = false;
            } else {
                $scope.noMoreFriendsWallItemsAvailable = true;
            }
            $scope.frnd_wall_posts = res.wall_posts;
            $scope.total_wall_post = res.total_wall_post;
            friends_wall_start = friends_wall_start + 5;
            friends_wall_limit = friends_wall_start + 5;
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.loadMoreFriendsProfileHomeWall = function (friendid) {
        Data.send({
            api_key: api_key,
            user_id: friendid,
            start: friends_wall_start,
            count: friends_wall_limit
        }, 'friendWallLoadMore').then(function (res) {
            $scope.frnd_wall_posts = $scope.frnd_wall_posts.concat(JSON.parse(JSON.stringify(res)).wall_posts);
            $scope.tmp_wall_post_frnd = res.wall_posts;
            friends_wall_start = friends_wall_start + 5;
            friends_wall_limit = friends_wall_start + 5;
            if (($scope.frnd_wall_posts.length >= $scope.total_wall_post) && res.wall_posts != 0) {
                $scope.noMoreFriendsWallItemsAvailable = true;
            } else {}
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $ionicSlideBoxDelegate.update();
    $scope.sendFriendRequest = function (id, sent_from) {
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            friend_id: id
        }, 'friendRequestSends').then(function (res) {
            if (res.success == 1) {

                /* if ($scope.all_members != null && $scope.all_members != undefined) {
                 angular.forEach($scope.all_members, function (value, key) {
                 
                 if (id == $scope.all_members[key].id) {
                 $scope.all_members[key].f_status = "Request Sent";
                 //console.log('send');
                 }
                 
                 });
                 
                 // //console.log($rootScope.all_members);
                 }
                 
                 
                 
                 if ($scope.friends != null && $scope.friends != undefined) {
                 
                 angular.forEach($scope.friends, function (value, key) {
                 
                 if (id == $scope.friends[key].id) {
                 $scope.friends[key].f_status = "Request Sent";
                 ////console.log($rootScope.connections[key].id);
                 }
                 
                 
                 
                 });
                 } */

                // $scope.getAllMembers();

                var alertPopup = $ionicPopup.alert({
                    title: 'Request successfully sent',
                    template: ''
                });
                if (sent_from == "allConnections") {
                    $scope.seeMoreFriends();
                }
                if (sent_from == "friendsProfile") {
                    $rootScope.viewFriendsProfile();
                }
                if (sent_from == "localAreaConnections") {
                    $scope.localConnections();
                }
                if (sent_from == "whoLikedMyPost") {
                    $scope.openWhoLikePost($stateParams.postid);
                }
                if (sent_from == "whoViewedMyProfile") {
                    $scope.openWhoViewMyFProfile();
                }
                if (sent_from == "allMembers") {
                    $scope.getAllMembers();
                }
            } else {}
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.acceptFriendRequest = function (f_id, sent_from) {
        Data.send({
            api_key: api_key,
            s_id: f_id
        }, 'acceptFriendRequest').then(function (res) {
            if (res.success == 1) {

                /* if ($scope.all_members != null && $scope.all_members != undefined) {
                 angular.forEach($scope.all_members, function (value, key) {
                 
                 if (id == $scope.all_members[key].id) {
                 $scope.all_members[key].f_status = "Disconnect";
                 }
                 
                 });
                 
                 // //console.log($rootScope.all_members);
                 }
                 
                 
                 
                 if ($scope.friends != null && $scope.friends != undefined) {
                 
                 angular.forEach($scope.friends, function (value, key) {
                 
                 if (id == $scope.friends[key].id) {
                 $scope.friends[key].f_status = "Disconnect";
                 ////console.log($rootScope.connections[key].id);
                 }
                 
                 
                 
                 });
                 } */

                var alertPopup = $ionicPopup.alert({
                    title: 'Member request accepted successfully',
                    template: ''
                });
                if (sent_from == "allConnections") {
                    $scope.seeMoreFriends();
                }
                if (sent_from == "friendsProfile") {
                    $rootScope.viewFriendsProfile();
                }
                if (sent_from == "localAreaConnections") {
                    $scope.localConnections();
                }
                if (sent_from == "myConnections") {
                    /* $scope.closeConnRequests(); */
                    $scope.getFriends();
                }
                if (sent_from == "whoLikedMyPost") {
                    $scope.openWhoLikePost($stateParams.postid);
                }
                if (sent_from == "whoViewedMyProfile") {
                    $scope.openWhoViewMyFProfile();
                }
                if (sent_from == "allMember") {
                    $scope.getAllMembers();
                }
                if (sent_from == "myRequests") {
                    $scope.allRequests();
                    /* $scope.getFriends(); */
                }
            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.rejectFriendRequest = function (f_id, sent_from) {
        Data.send({
            api_key: api_key,
            s_id: f_id
        }, 'rejectFriendRequest').then(function (res) {
            if (res.success == 1) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Friend request rejected successfully',
                    template: ''
                });
                if (sent_from == "allConnections") {
                    $scope.seeMoreFriends();
                }
                if (sent_from == "friendsProfile") {
                    $rootScope.viewFriendsProfile();
                }
                if (sent_from == "localAreaConnections") {
                    $scope.localConnections();
                }
                if (sent_from == "myConnections") {
                    $scope.closeConnRequests();
                    $scope.getFriends();
                }
                if (sent_from == "whoLikedMyPost") {
                    $scope.openWhoLikePost($stateParams.postid);
                }
                if (sent_from == "whoViewedMyProfile") {
                    $scope.openWhoViewMyFProfile();
                }
                if (sent_from == "allMember") {
                    $scope.getAllMembers();
                }
                if (sent_from == "myRequests") {
                    $scope.allRequests();
                }
            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.cancelFriendRequest = function (id, sent_from) {
        Data.send({
            api_key: api_key,
            friend_id: id
        }, 'cancelFriendRequest').then(function (res) {
            if (res.success == 1) {

                /* if ($scope.all_members != null && $scope.all_members != undefined) {
                 angular.forEach($scope.all_members, function (value, key) {
                 
                 if (id == $scope.all_members[key].id) {
                 $scope.all_members[key].f_status = "Connect";
                 }
                 
                 });
                 
                 // //console.log($rootScope.all_members);
                 }
                 
                 
                 
                 if ($scope.friends != null && $scope.friends != undefined) {
                 
                 angular.forEach($scope.friends, function (value, key) {
                 
                 if (id == $scope.friends[key].id) {
                 $scope.friends[key].f_status = "Connect";
                 ////console.log($rootScope.connections[key].id);
                 }
                 
                 
                 
                 });
                 } */

                var alertPopup = $ionicPopup.alert({
                    title: 'Request cancelled',
                    template: ''
                });
                if (sent_from == "allConnections") {
                    $scope.seeMoreFriends();
                }
                if (sent_from == "friendsProfile") {
                    $rootScope.viewFriendsProfile();
                }
                if (sent_from == "localAreaConnections") {
                    $scope.localConnections();
                }
                if (sent_from == "whoLikedMyPost") {
                    $scope.openWhoLikePost($stateParams.postid);
                }
                if (sent_from == "whoViewedMyProfile") {
                    $scope.openWhoViewMyFProfile();
                }
                if (sent_from == "allMembers") {
                    $scope.getAllMembers();
                }
            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.userDisconnect = function (f_id, sent_from) {
        var confirmDiscon = $ionicPopup.confirm({
            title: 'Are you sure you want to disconnect ?',
            template: ''
        });
        confirmDiscon.then(function (res) {
            if (res) {
                $scope.disconnectFriend(f_id, sent_from);
            } else {}
        });
        $timeout(function () {
            confirmDiscon.close();
        }, 10000);
    };
    $scope.disconnectFriend = function (f_id, sent_from) {
        Data.send({
            api_key: api_key,
            friend_id: f_id
        }, 'disconnectFriend').then(function (res) {
            if (res.success == 1) {
                $scope.showSuccess('Friend disconnected successfully');
                if (sent_from == "allConnections") {
                    $scope.seeMoreFriends();
                }
                if (sent_from == "friendsProfile") {
                    $rootScope.viewFriendsProfile();
                }
                if (sent_from == "localAreaConnections") {
                    $scope.localConnections();
                }
                if (sent_from == "myConnections") {
                    $scope.getFriends();
                }
                if (sent_from == "whoLikedMyPost") {
                    $scope.openWhoLikePost($stateParams.postid);
                }
                if (sent_from == "whoViewedMyProfile") {
                    $scope.openWhoViewMyFProfile();
                }
                if (sent_from == "allMember") {
                    $scope.getAllMembers();
                }
            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.wallImagePopUp = function (url, wallViewImage) {

        var wllImg = '<ion-scroll overflow-scroll="false" zooming="true" direction="xy" ><img src="' + url + wallViewImage + '"></ion-scroll>';

        var alertPopup = $ionicPopup.alert({
            template: wllImg,
            cssClass: 'wall-Image-PopUp',
            buttons: [{
                text: 'Cancel',
                type: 'button-clear'
            }]
        });
    };
    $scope.openNewMessageProfile = function (id, uname) {
        $ionicModal.fromTemplateUrl('templates/modal/new_message_profile.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalNewMessageProfile = modal;
            $scope.userProfileId = id;
            $scope.useruName = uname;
            $scope.modalNewMessageProfile.show();
        });
    };
    $scope.closeNewMessage = function () {
        $scope.modalNewMessage.hide();
    };
    $scope.closeNewMessageProfile = function () {
        $scope.modalNewMessageProfile.hide();
    };
    $scope.composeMessageProfile = function (friend, msg_body, msg_sub) {



        if ((msg_sub == null || msg_sub == undefined) && (msg_body == undefined || msg_body == null) && (friend == null || friend == '')) {
            var confirmPopup = $ionicPopup.confirm({
                title: 'You need to type a message',
                buttons: [{
                    text: 'OK',
                    type: 'button-positive',
                    onTap: function (e) {
                        confirmPopup.close();
                    }
                }]
            });
        } else {
            $ionicLoading.show();
            var friend_ids = [];
            friend_ids.push(friend);
            Data.send({
                api_key: api_key,
                friend_id: JSON.stringify(friend_ids),
                msg_body: msg_body,
                msg_sub: msg_sub
            }, 'sendCreateMsg').then(function (res) {
                $scope.selectedUsers = [];
                $scope.closeNewMessageProfile();
                $ionicLoading.hide();
                $scope.showSuccess('Message has been sent');
            }, function (x) {
                $scope.showError("Check your connection!");
                $ionicLoading.hide();
            });
        }
    };
    $scope.openShowcase_image = function (user_images) {
        $ionicModal.fromTemplateUrl('templates/modal/showcase_image.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalShowcase_image = modal;
            $scope.user_images = user_images;
            $scope.modalShowcase_image.show();
        });
    };
    $scope.closeShowcase_image = function () {
        $scope.modalShowcase_image.hide();
    };



    ionic.material.ink.displayEffect();
});
app.controller('MyProfileCtrl', function ($scope, $ionicLoading, Data, TBC, TbcAuthService, $ionicModal) {
    api_key = window.localStorage.getItem('userkey');
    $ionicLoading.show();
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = false;
    });
    $scope.openWhoViewMyFProfile = function () {
        $ionicLoading.show();
        $ionicModal.fromTemplateUrl('templates/modal/who_view_myprofile.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalWhoViewMyProfile = modal;
            $scope.viewUserViewers();
            $scope.modalWhoViewMyProfile.show();
        });
    };
    $scope.closeWhoViewMyFProfile = function () {
        $scope.modalWhoViewMyProfile.hide();
    };
    $scope.viewUserDetails = function () {
        Data.send({
            api_key: api_key
        }, 'user').then(function (res) {
            if (res.success == 1) {
                $scope.user = res.user;
                $scope.user_views = res.user_views;
                $scope.user_view_quantity = 3;
                $scope.$broadcast('scroll.refreshComplete');
                $ionicLoading.hide();
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.viewUserDetails();
});
app.controller('EditProfileCtrl', function ($scope, $ionicLoading, $cordovaFileTransfer, $state, $rootScope, $ionicPopup, $timeout, $ionicModal, $ionicActionSheet, Data, TBC, TbcAuthService) {
    api_key = window.localStorage.getItem('userkey');
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = true;
    });
    $ionicLoading.show();
    var imagesCase = [];
    $scope.serverImageCase = [];
    $scope.userImages = {};
    $scope.imgCase = imagesCase;
    var increCase = 0;
    var numImageSelect = 6;
    $scope.user = {};
    $scope.viewUserDetailsForEdit_test = function () {
        Data.send({
            api_key: api_key
        }, 'edituser').then(function (res) {
            $scope.userImages = res.user.user_gallery;
            $scope.userImagesCase = res.user.user_gallery;
            $scope.user = res.user;

            $scope.business_types = res.busin_type;
            $scope.business_sectors = res.busin_sector;

            $ionicLoading.hide();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.openEditBasicDetails = function () {
        $ionicModal.fromTemplateUrl('templates/profile-edits/edit_basic_details.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalEditBasicDetails = modal;
            $scope.modalEditBasicDetails.show();
        });
    };
    $scope.closeEditBasicDetails = function () {
        $scope.modalEditBasicDetails.hide();
    };
    $scope.getTown = function (county) {
        Data.send({
            county_id: county
        }, 'getTowns').then(function (res) {
            $scope.towns = JSON.parse(JSON.stringify(res)).towns;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.openEditContactDetails = function () {
        $ionicModal.fromTemplateUrl('templates/profile-edits/edit_contact_details.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $ionicLoading.show();
            Data.send({
                api_key: api_key
            }, 'edituser').then(function (res) {
                Data.send({}, 'getCounties').then(function (res1) {
                    $scope.counties = res1.counties;
                    if (res1.counties.length <= 0) {
                        $scope.enable_town = false;
                    } else {
                        Data.send({
                            county_id: res.user.country
                        }, 'getTowns').then(function (res2) {
                            $scope.towns = res2.towns;
                            $ionicLoading.hide();
                        }, function (x) {
                            $scope.showError("Check your connection!");
                        });
                        $scope.enable_town = true;
                    }
                }, function (x) {
                    $scope.showError("Check your connection!");
                });
                $scope.business_types = res.busin_type;
                $scope.business_sectors = res.busin_sector;
                $scope.date = res.date;
                $scope.month = res.month;
                $scope.year = res.year;
                $scope.userImages = {};
                $scope.userImages = res.user.user_gallery;
                $scope.user = res.user;
            }, function (x) {
                $scope.showError("Check your connection!");
            });
            $scope.modalEditContactDetails = modal;
            $scope.modalEditContactDetails.show();
        });
    };
    $scope.closeEditContactDetails = function () {
        $scope.modalEditContactDetails.hide();
    };
    $scope.openEditCompanyDetails = function (business_types, business_sectors) {
        $ionicModal.fromTemplateUrl('templates/profile-edits/edit_company_details.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalEditCompanyDetails = modal;

            console.log(business_types);
            
            $scope.business_types = business_types;
            $scope.business_sectors = business_sectors;

            $scope.modalEditCompanyDetails.show();

        });
    };
    $scope.closeEditCompanyDetails = function () {
        $scope.modalEditCompanyDetails.hide();
    };
    $scope.openEditPersonalDetails = function () {
        $ionicModal.fromTemplateUrl('templates/profile-edits/edit_personal_details.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $ionicLoading.show();
            Data.send({
                api_key: api_key
            }, 'edituser').then(function (res) {
                Data.send({}, 'getCounties').then(function (res1) {
                    $scope.counties = res1.counties;
                    if (res1.counties.length <= 0) {
                        $scope.enable_town = false;
                    } else {
                        Data.send({
                            county_id: res.user.country
                        }, 'getTowns').then(function (res2) {
                            $scope.towns = res2.towns;
                            $ionicLoading.hide();
                        }, function (x) {
                            $scope.showError("Check your connection!");
                        });
                        $scope.enable_town = true;
                    }
                }, function (x) {
                    $scope.showError("Check your connection!");
                });
                $scope.business_types = res.busin_type;
                $scope.business_sectors = res.busin_sector;
                $scope.date = res.date;
                $scope.month = res.month;
                $scope.year = res.year;
                $scope.userImages = {};
                $scope.userImages = res.user.user_gallery;
                $scope.user = res.user;
            }, function (x) {
                $scope.showError("Check your connection!");
            });
            $scope.modalEditPersonalDetails = modal;
            $scope.modalEditPersonalDetails.show();
        });
    };
    $scope.closeEditPersonalDetails = function () {
        $scope.modalEditPersonalDetails.hide();
    };
    $scope.viewUserDetails = function () {
        Data.send({
            api_key: api_key
        }, 'user').then(function (res) {
            if (res.success == 1) {
                $scope.user = res.user;
                $scope.user_views = res.user_views;
                $scope.user_view_quantity = 3;
                $scope.$broadcast('scroll.refreshComplete');
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.removeUploadImage_tmp_profile = function (item) {
        var index = $scope.imgCase.indexOf(item);
        $scope.imgCase.splice(index, 1);
        numImageSelect++;
    };
    $scope.removeSelectedUserImage_tmp = function (item) {
        var index = $scope.userImages.indexOf(item);
        $scope.userImages.splice(index, 1);
    };
    $scope.selectImages_tmp_profile = function (num, img_type) {
        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            window.imagePicker.getPictures(function (results) {
                for (var i = 0; i < results.length; i++) {
                    if (ionic.Platform.isAndroid()) {
                        $scope.imgCase.push(results[i]);
                    }else{
                        $scope.imgCase.push(window.Ionic.normalizeURL(results[i]));

                    }
                    $state.reload();
                }
            }, function (error) {
                $scope.showError("Poor network connection. Check your connection!");
            }, {
                maximumImagesCount: num,
                quality: 60
            });
        }
    };
    $scope.uploadPicsProfile = function (img_type, saveDetails, api_key) {
        $ionicLoading.show();
        var file_ids = [];
        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            imagesCase.forEach(function (i) {
                var options = new FileUploadOptions();
                options.fileKey = "uploadfile";
                options.fileName = i.substr(i.lastIndexOf('/') + 1);
                options.mimeType = "image/jpeg";
                var params = new Object();
                var params = new Object();
                params.api_key = api_key;
                params.src = img_type;
                options.params = params;
                options.chunkedMode = false;
                $cordovaFileTransfer.upload(encodeURI(TBC.URL + 'imageUploadToServer'), i, options).then(function (r) {
                    var str = r.response;
                    var d = str.trim();
                    var obj = JSON.parse(d);
                    $scope.serverImageCase.push(obj);
                    increCase++;
                    if (increCase == imagesCase.length) {
                        angular.forEach($scope.userImagesCase, function (value, key) {
                            this.push(value['file_id']);
                        }, file_ids);
                        angular.forEach($scope.serverImageCase, function (value, key) {
                            this.push(value['file_id']);
                        }, file_ids);
                        if (img_type == 'user_gallery') {
                            Data.send({
                                api_key: api_key,
                                company_name: saveDetails.company_name,
                                contact_name: saveDetails.contact_name,
                                user_address1: saveDetails.user_address1,
                                user_address2: saveDetails.user_address2,
                                town_city: saveDetails.town_city,
                                country: saveDetails.country,
                                post_code: saveDetails.postcode,
                                user_tel: saveDetails.user_tel,
                                user_fax: saveDetails.user_fax,
                                user_mobile: saveDetails.user_mobile,
                                user_email: saveDetails.user_email,
                                user_email2: saveDetails.user_email2,
                                user_fb: saveDetails.user_fb,
                                agent_id: saveDetails.agent_id,
                                user_tw: saveDetails.user_tw,
                                reg_no: saveDetails.reg_no,
                                vat_no: saveDetails.vat_no,
                                busin_type: saveDetails.busin_type,
                                emp_count: saveDetails.emp_count,
                                website: saveDetails.website,
                                pinned: saveDetails.user_in,
                                linked: saveDetails.user_lk,
                                youtube: saveDetails.user_yu,
                                abt_busin: saveDetails.abt_busin,
                                edit_tms: saveDetails.edit_tms,
                                month_select: saveDetails.month_select,
                                day_select: saveDetails.day_select,
                                year_select: saveDetails.year_select,
                                busin_sector: saveDetails.business_sector,
                                tbc_visible: saveDetails.tbc_visible,
                                publish_term: saveDetails.publish_term,
                                key_words: saveDetails.key_words,
                                txtSmallFileNameSup: saveDetails.txtSmallFileNameSup,
                                objId: saveDetails.objId,
                                image_ids: file_ids
                            }, 'userupdate').then(function (res) {
                                $ionicLoading.hide();


                                Data.send({
                                    api_key: api_key
                                }, 'user').then(function (ress) {
                                    if (res.success == 1) {
                                        $rootScope.appUserData = ress.user;
                                        $rootScope.initUser = ress.user.login_action;
                                        $rootScope.userImagewithUrl = ress.user.image_url + ress.user.user_image;

                                    }
                                }, function (x) {
                                    $scope.showError("Check your connection!");
                                });
                                $scope.showSuccess('Profile updated');
                                $scope.imgCase = [];
                                $scope.viewUserDetailsForEdit_test();
                            }, function (x) {
                                $scope.showError("Check your connection!");
                            });
                        }
                    }
                }, function (err) {}, function (progress) {
                    if (progress.lengthComputable) {} else {}
                });
            });
        }
    };
    $scope.updateUser = function (userDetails, statusclose) {
        if (userDetails.postcode == null && userDetails.town_city == null) {
            $ionicPopup.alert({
                title: 'Profile required',
                template: 'Town And Postal Code is required'
            });
        } else if (userDetails.postcode == null) {
            $ionicPopup.alert({
                title: 'Profile required',
                template: 'Postal Code is required'
            });
        } else if (userDetails.town_city == null) {
            $ionicPopup.alert({
                title: 'Profile required',
                template: 'Town is required'
            });
        } else {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Are you sure you want to update profile?',
                template: '',
                okText: 'Update'
            });
            confirmPopup.then(function (res) {
                if (res) {
                    if (userDetails['user_gallery']) {
                        $check_image = 'have image';
                    } else {
                        $check_image = 'no image';
                    }
                    if ($scope.imgCase == '') {
                        $upload_image = 'no image';
                    } else {
                        $upload_image = 'have image';
                    }
                    if ($upload_image == "have image" || $check_image == "have image") {
                        if ($upload_image == "have image" && $check_image == "have image") {
                            $scope.uploadPicsProfile('user_gallery', userDetails, api_key);
                        } else if ($upload_image == "have image") {
                            $scope.uploadPicsProfile('user_gallery', userDetails, api_key);
                        } else if ($check_image == "have image") {
                            var file_ids = [];
                            angular.forEach($scope.userImages, function (value, key) {
                                this.push(value['file_id']);
                            }, file_ids);
                            $ionicLoading.show();
                            Data.send({
                                api_key: api_key,
                                company_name: userDetails.company_name,
                                contact_name: userDetails.contact_name,
                                user_address1: userDetails.user_address1,
                                user_address2: userDetails.user_address2,
                                town_city: userDetails.town_city,
                                country: userDetails.country,
                                post_code: userDetails.postcode,
                                user_tel: userDetails.user_tel,
                                user_fax: userDetails.user_fax,
                                user_mobile: userDetails.user_mobile,
                                user_email: userDetails.user_email,
                                user_email2: userDetails.user_email2,
                                user_fb: userDetails.user_fb,
                                agent_id: userDetails.agent_id,
                                user_tw: userDetails.user_tw,
                                reg_no: userDetails.reg_no,
                                vat_no: userDetails.vat_no,
                                busin_type: userDetails.busin_type,
                                emp_count: userDetails.emp_count,
                                website: userDetails.website,
                                pinned: userDetails.user_in,
                                linked: userDetails.user_lk,
                                youtube: userDetails.user_yu,
                                abt_busin: userDetails.abt_busin,
                                edit_tms: userDetails.edit_tms,
                                month_select: userDetails.month_select,
                                day_select: userDetails.day_select,
                                year_select: userDetails.year_select,
                                busin_sector: userDetails.business_sector,
                                tbc_visible: userDetails.tbc_visible,
                                publish_term: userDetails.publish_term,
                                key_words: userDetails.key_words,
                                txtSmallFileNameSup: userDetails.txtSmallFileNameSup,
                                objId: userDetails.objId,
                                image_ids: file_ids
                            }, 'userupdate').then(function (res) {

                                Data.send({
                                    api_key: api_key
                                }, 'user').then(function (ress) {
                                    if (res.success == 1) {
                                        $rootScope.appUserData = ress.user;
                                        $rootScope.initUser = ress.user.login_action;
                                        $rootScope.userImagewithUrl = ress.user.image_url + ress.user.user_image;

                                    }
                                }, function (x) {
                                    $scope.showError("Check your connection!");
                                });
                                $scope.viewUserDetailsForEdit_test();
                                $ionicLoading.hide();
                                $scope.showSuccess('Profile Updated');
                                $timeout(function () {
                                    $scope.$broadcast('scroll.refreshComplete');
                                    $scope.$broadcast('scroll.infiniteScrollComplete');
                                    confirmPopup.close();
                                });
                            }, function (x) {
                                $scope.showError("Check your connection!");
                            });
                        }
                    } else {
                        $ionicLoading.show();
                        Data.send({
                            api_key: api_key,
                            company_name: userDetails.company_name,
                            contact_name: userDetails.contact_name,
                            user_address1: userDetails.user_address1,
                            user_address2: userDetails.user_address2,
                            town_city: userDetails.town_city,
                            country: userDetails.country,
                            post_code: userDetails.postcode,
                            user_tel: userDetails.user_tel,
                            user_fax: userDetails.user_fax,
                            user_mobile: userDetails.user_mobile,
                            user_email: userDetails.user_email,
                            user_email2: userDetails.user_email2,
                            user_fb: userDetails.user_fb,
                            agent_id: userDetails.agent_id,
                            user_tw: userDetails.user_tw,
                            reg_no: userDetails.reg_no,
                            vat_no: userDetails.vat_no,
                            busin_type: userDetails.busin_type,
                            emp_count: userDetails.emp_count,
                            website: userDetails.website,
                            pinned: userDetails.user_in,
                            linked: userDetails.user_lk,
                            youtube: userDetails.user_yu,
                            abt_busin: userDetails.abt_busin,
                            edit_tms: userDetails.edit_tms,
                            month_select: userDetails.month_select,
                            day_select: userDetails.day_select,
                            year_select: userDetails.year_select,
                            busin_sector: userDetails.business_sector,
                            tbc_visible: userDetails.tbc_visible,
                            publish_term: userDetails.publish_term,
                            key_words: userDetails.key_words,
                            txtSmallFileNameSup: userDetails.txtSmallFileNameSup,
                            objId: userDetails.objId,
                            image_ids: ''
                        }, 'userupdate').then(function (res) {

                            Data.send({
                                api_key: api_key
                            }, 'user').then(function (ress) {
                                if (res.success == 1) {
                                    $rootScope.appUserData = ress.user;
                                    $rootScope.initUser = ress.user.login_action;
                                    $rootScope.userImagewithUrl = ress.user.image_url + ress.user.user_image;

                                }
                            }, function (x) {
                                $scope.showError("Check your connection!");
                            });
                            $scope.viewUserDetailsForEdit_test();
                            $ionicLoading.hide();
                            $scope.showSuccess('Profile Updated');
                            $timeout(function () {
                                $scope.$broadcast('scroll.refreshComplete');
                                $scope.$broadcast('scroll.infiniteScrollComplete');
                                confirmPopup.close();
                            });
                        }, function (x) {
                            $scope.showError("Check your connection!");
                        });
                    }
                } else {}
                confirmPopup.close();
                if (statusclose == 1)
                    $scope.closeEditBasicDetails();
                if (statusclose == 2)
                    $scope.closeEditCompanyDetails();
                if (statusclose == 3)
                    $scope.closeEditContactDetails();
                if (statusclose == 4)
                    $scope.closeEditPersonalDetails();
            });
        }
    };

    function image_upload(imgLoc, api, num_img) {
        var imageURI = imgLoc;
        var options = new FileUploadOptions();
        options.fileKey = "uploadfile";
        options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
        options.mimeType = "image/jpeg";
        var params = new Object();
        var params = new Object();
        params.api_key = api;
        params.src = num_img;
        options.params = params;
        options.chunkedMode = false;
        var ft = new FileTransfer();
        $ionicLoading.show();
        ft.onprogress = function (progressEvent) {
            if (progressEvent.lengthComputable) {
                if (progressEvent.total == progressEvent.loaded) {
                    $ionicLoading.hide();
                }
            } else {}
        }
        ft.upload(imageURI, encodeURI(TBC.URL + 'imageUploadToServer'), win, fail, options);
    }

    function win(r) {
        if (r.response.indexOf('uploads') >= 0) {
            $ionicLoading.hide();
        } else {
            var resp_err = String(r.response).replace(/<[^]+>/gm, '');
            $ionicLoading.hide();
        }
    }

    function fail(error) {}
    $scope.viewUserDetailsForEdit_test();
    $scope.profileImgChange = function (num_img, img_type) {
        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            window.imagePicker.getPictures(function (results) {
                for (var i = 0; i < results.length; i++) {
                    $scope.imgProfileUrl = results[i];
                    image_upload(results[i], api_key, img_type);
                    $state.reload();
                }
            }, function (error) {
                $scope.showError("Poor network connection. Check your connection!");
            }, {
                maximumImagesCount: num_img,
                quality: 60
            });
        }
    };
    $scope.profileImgChangeCamera = function (num_img, img_type) {
        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            var cameraOptions = {
                quality: 60,
                destinationType: Camera.DestinationType.FILE_URI,
                encodingType: Camera.EncodingType.JPEG,
                mediaType: Camera.MediaType.PICTURE,
                allowEdit: true
            };
            navigator.camera.getPicture(function (success) {
                $ionicLoading.show();
                $rootScope.userImagewithUrl = success;
                var options = new FileUploadOptions();
                options.fileKey = "uploadfile";
                options.fileName = success.substr(success.lastIndexOf('/') + 1);
                options.mimeType = "image/jpeg";
                var params = new Object();
                var params = new Object();
                params.api_key = api_key;
                params.src = img_type;
                options.params = params;
                options.chunkedMode = false;
                $cordovaFileTransfer.upload(encodeURI(TBC.URL + 'imageUploadToServer'), success, options).then(function (result) {
                    Data.send({
                        api_key: api_key
                    }, 'user').then(function (res) {
                        if (res.success == 1) {
                            $rootScope.userImagewithUrl = res.user.image_url + res.user.user_image;
                            $ionicLoading.hide();
                            $scope.showSuccess('Profile updated');
                        }
                    }, function (x) {
                        $scope.showError("Check your connection!");
                    });
                }, function (err) {}, function (progress) {
                    if (progress.lengthComputable) {} else {}
                });
            }, function (error) {}, cameraOptions);
        }
    };
    $scope.wallCameraOption = function (num_img, img_type) {
        TbcAuthService.getFileUploadPermission();
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Load from Library'
            }, {
                text: 'Use Camera'
            }],
            titleText: 'Selec Image',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    $scope.profileImgChange(1, img_type);
                } else if (index == 1) {
                    $scope.profileImgChangeCamera(1, img_type);
                }
                return true;
            }
        });
    };
    $scope.profileImgChange = function (num_img, img_type) {
        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            window.imagePicker.getPictures(function (results) {
                for (var i = 0; i < results.length; i++) {
                    $ionicLoading.show();
                    $rootScope.userImagewithUrl = results[i];
                    var options = new FileUploadOptions();
                    options.fileKey = "uploadfile";
                    options.fileName = results[i].substr(results[i].lastIndexOf('/') + 1);
                    options.mimeType = "image/jpeg";
                    var params = new Object();
                    var params = new Object();
                    params.api_key = api_key;
                    params.src = img_type;
                    options.params = params;
                    options.chunkedMode = false;
                    $cordovaFileTransfer.upload(encodeURI(TBC.URL + 'imageUploadToServer'), results[i], options).then(function (result) {
                        Data.send({
                            api_key: api_key
                        }, 'user').then(function (res) {
                            if (res.success == 1) {
                                $rootScope.userImagewithUrl = res.user.image_url + res.user.user_image;
                                $ionicLoading.hide();
                                $scope.showSuccess('Profile updated');
                            }
                        }, function (x) {
                            $scope.showError("Check your connection!");
                        });
                    }, function (err) {}, function (progress) {
                        if (progress.lengthComputable) {} else {}
                    });
                }
            }, function (error) {
                $scope.showError("Poor network connection. Check your connection!");
            }, {
                maximumImagesCount: num_img,
                quality: 60
            });
        }
    };
});
app.controller('AdsingleCtrl', function ($scope, $ionicModal, $ionicActionSheet, $rootScope, $ionicPopup, $ionicLoading, $ionicSlideBoxDelegate, $stateParams, Data, TbcAuthService) {
    /** 
     * Single Ads templates/product-detail.html
     * ===============================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer    : Mohamed Rimsan - rimsnet@gmail.com
     * Controller   : AdsingleCtrl
     * Main Method  : app.controller('AdsingleCtrl',function(......){});
     * Reuse Method : -
     * Scope Method :              
     * Date         : 2017-04-20
     * ===============================================================
     * */
    api_key = window.localStorage.getItem('userkey');
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = true;
    });
    $ionicLoading.show();
    var product_id = $stateParams.id;
    $scope.varp = 1;
    $scope.clicked = function (num) {
        $scope.varp = num;
        if (num == 2) {}
    };
    $scope.adsImageView = function (adImage) {

        var wllImg = '<ion-scroll overflow-scroll="false" zooming="true" direction="xy" ><img src="' + adImage + '"></ion-scroll>';

        var alertPopup = $ionicPopup.alert({
            template: wllImg,
            cssClass: 'ads-Image-PopUp',
            buttons: [{
                text: 'Cancel',
                type: 'button-clear'
            }]
        });
    };
    $scope.singleProductView = function () {
        Data.get('order/' + $stateParams.id).then(function (res) {
            Data.send({
                api_key: api_key
            }, 'userView').then(function (res) {
                if (res.success == 1) {
                    $rootScope.userDetails = res.user;
                }
            }, function (x) {
                $scope.showError("Check your connection!");
            });
            if (res.success == "1") {
                $scope.productE = res.product;
                $scope.repost_this = 'pro.' + res.product.product_id;
                $scope.product_mine = res.product_mine;
                $scope.countdown_second = res.product.countdown_second;
                $scope.$broadcast('timer-set-countdown', res.product.countdown_second);
                $rootScope.mapStatusProduct = false;
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({
                    'address': $scope.productE.postcode
                }, function (results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        $rootScope.latp = results[0].geometry.location.lat();
                        $rootScope.lngp = results[0].geometry.location.lng();
                        $rootScope.mapStatusProduct = true;
                    } else {
                        $rootScope.mapStatusProduct = false;
                    }
                });
            }
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
            $ionicSlideBoxDelegate.update();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.singleProductView();
    $scope.showActionsheetPorduct = function (product_id, phone) {
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Place Enquiry'
            }, {
                text: 'Call Member'
            }],
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    $scope.openAddAdsEnquiry(product_id.product_id);
                } else if (index == 1) {
                    var number = phone;


                    console.log(phone);




                    window.plugins.CallNumber.callNumber(function () {}, function () {}, number);
//                    var alertPopup = $ionicPopup.alert({
//                        cssClass: 'productCall',
//                        template: '<a href="tel:{number}"> Call Now - {{number}} </a>' 
//                    });
//                    alertPopup.then(function(res) {
//                        console.log('Thank you for not eating my delicious ice cream cone');
//                    });
                }
                return true;
            }
        });
    };
    $ionicModal.fromTemplateUrl('templates/modal/add_ads_enquiry.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalAddAdsEnquiry = modal;
    });
    $scope.openAddAdsEnquiry = function (product_id) {
        $scope.modalAddAdsEnquiry.show();
        Data.get('order/' + product_id).then(function (res) {
            $scope.product = res.product;
            $ionicSlideBoxDelegate.update();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    
    $scope.closeAddAdsEnquiry = function () {
        $scope.modalAddAdsEnquiry.hide();
    };
    $scope.addProductEnquiry = function (enquiryDetails, product_id) {
        if (enquiryDetails == null || enquiryDetails == '') {
            var confirmPopup = $ionicPopup.confirm({
                title: 'You need to type a message',
                buttons: [{
                    text: 'OK',
                    type: 'button-positive',
                    onTap: function (e) {
                        confirmPopup.close();
                    }
                }]
            });
        } else {
            $ionicLoading.show();
            Data.send({
                api_key: api_key,
                product_id: product_id,
                product_message: enquiryDetails.question
            }, 'productEnquiry').then(function (res) {
                if (res.success == 1) {
                    $ionicLoading.hide();
                    enquiryDetails.question = "";
                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Your enquiry has been sent',
                        buttons: [{
                            text: 'OK',
                            type: 'button-positive',
                            onTap: function (e) {
                                $scope.closeAddAdsEnquiry();
                                confirmPopup.close();
                            }
                        }]
                    });
                }
            }, function (x) {
                $scope.showError("Check your connection!");
            });
        }
    };
    ionic.material.ink.displayEffect();
});
app.controller('EditProductCtrl', function ($scope, $cordovaSocialSharing, $ionicModal, $ionicScrollDelegate, $ionicLoading, Data, TBC, TbcAuthService) {});
app.controller('NetworkCtrl', function ($scope, $ionicModal, $ionicScrollDelegate, $ionicLoading, Data, TbcAuthService, $ionicPopup, $rootScope, $stateParams, $state) {
    api_key = window.localStorage.getItem('userkey');
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = false;
    });
    $scope.var3 = 1;
    $scope.query = '';

    $scope.ConnectionsNavigation = function (num, abc) {
        $scope.var3 = num;

        if (abc) {

            $scope.query = abc;
        } else {

            $scope.query = '';
        }
        if (num == 1) {
            $scope.county_name = "All";
            $scope.town_id = "All";

            $scope.getFriends();

        } else if (num == 2) {
            $scope.county_name = "All";
            $scope.town_id = "All";
            $scope.business_type = "All";
            $scope.business_sector = "All";

            $scope.getAllMembers();

        } else if (num == 3) {
            $scope.allRequests();
        }
    };
    $ionicModal.fromTemplateUrl('templates/modal/filter_ad_location.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalLocationFilter = modal;
    });
    $scope.openLocationFilter = function () {
        $ionicLoading.show();
        $ionicModal.fromTemplateUrl('templates/modal/filter_ad_location.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            Data.send({}, 'getCounties').then(function (res) {
                $scope.counties = res.counties;
                $ionicLoading.hide();
            }, function (x) {
                $scope.showError("Check your connection!");
            });
            $scope.modalLocationFilter = modal;
            $scope.modalLocationFilter.show();
        });
    };
    $scope.getTown = function (county) {
        Data.send({
            county_id: county
        }, 'getTowns').then(function (res) {
            $scope.towns = JSON.parse(JSON.stringify(res)).towns;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.closeLocationFilter = function () {
        $scope.modalLocationFilter.hide();
    };
    $scope.noMoreGetFriendsAvailable = false;
    $scope.getFriends = function (filter) {



        $ionicLoading.show();
        if (filter) {
            if (filter.county_id) {
                $county_name = filter.county_id;
            } else {
                $county_name = "All";
            }
            if (filter.town_id) {
                $town_id = filter.town_id;
            } else {
                $town_id = "All";
            }
        } else {
            $county_name = "All";
            $town_id = "All";
        }
        if ($county_name == "All") {
            $town_id = "All";
        }
        $scope.my_connections_start = 0;
        $scope.my_connections_limit = 10;
        Data.send({
            api_key: api_key,
            county_name: $county_name,
            town_id: $town_id,
            start: $scope.my_connections_start,
            count: $scope.my_connections_limit,
            search: $scope.query
        }, 'myfriends').then(function (res) {
            var resData = res;
            if (resData.success == 1) {
                $scope.closeLocationFilter();
                if (resData.my_friends_count >= 10) {
                    $scope.noMoreGetFriendsAvailable = false;
                } else {
                    $scope.noMoreGetFriendsAvailable = true;
                }
                $scope.county_name = $county_name;
                $scope.town_id = $town_id;
                $scope.img_url = resData.img_url;
                $scope.have_friends = true;
                if ($county_name == "All" && $town_id == "All") {
                    if (resData.my_friends == false) {} else {
                        $scope.friends = resData.my_friends;
                    }
                    $scope.my_friends_count = resData.my_friends_count;
                } else if ($county_name != "All" || $town_id != "All") {
                    $scope.search_friends = resData.my_friends;
                    $scope.search_my_friends_count = resData.my_friends_count;
                }
                $ionicScrollDelegate.resize();
                $scope.$broadcast('scroll.refreshComplete');
                $ionicLoading.hide();
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });
        $scope.my_connections_start = $scope.my_connections_start + 10;
    };
    $scope.my_connections_start = 10;
    $scope.my_connections_limit = 10;
    $scope.loadMoreGetFriends = function (county_name, town_id) {
        //console.log('loadMoreGetFriends ' + $scope.query);
        Data.send({
            api_key: api_key,
            county_name: county_name,
            town_id: town_id,
            start: $scope.my_connections_start,
            count: $scope.my_connections_limit,
            search: $scope.query
        }, 'myfriends').then(function (res) {
            if (res.my_friends == false) {
                $scope.noMoreGetFriendsAvailable = true;
            } else {
                $scope.my_connections_start = $scope.my_connections_start + 10;
                $scope.img_url = res.img_url;
                $scope.friends = $scope.friends.concat(JSON.parse(JSON.stringify(res.my_friends)));
                $scope.$broadcast('scroll.infiniteScrollComplete');
                if ($scope.friends.length >= $scope.my_friends_count) {
                    $scope.noMoreGetFriendsAvailable = true;
                } else {
                    $scope.noMoreGetFriendsAvailable = false;
                }
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.getFriends();
    $scope.noMoreAllMembersAvailable = false;
    $scope.getAllMembers = function (filter) {
        //console.log('getAllMembersA ' + $scope.query);
        if (filter) {
            if (filter.county_id) {
                $county_name = filter.county_id;
            } else {
                $county_name = "All";
            }
            if (filter.town_id) {
                $town_id = filter.town_id;
            } else {
                $town_id = "All";
            }
            if (filter.business_type) {
                $business_type = filter.business_type;
            } else {
                $business_type = "All";
            }
            if (filter.business_sector) {
                $business_sector = filter.business_sector;
            } else {
                $business_sector = "All";
            }
        } else {
            $county_name = "All";
            $town_id = "All";
            $business_type = "All";
            $business_sector = "All";
        }
        if ($county_name == "All") {
            $town_id = "All";
        }
        $scope.all_members_start = 0;
        $scope.all_members_limit = 10;
        Data.send({
            api_key: api_key,
            start: $scope.all_members_start,
            count: $scope.all_members_limit,
            county_name: $county_name,
            town_id: $town_id,
            business_type: $business_type,
            business_sector: $business_sector,
            search: $scope.query
        }, 'getAllMembers').then(function (res) {
            var resData = res;
            $scope.county_name = $county_name;
            $scope.town_id = $town_id;
            $scope.business_type = $business_type;
            $scope.business_sector = $business_sector;
            $scope.img_url = resData.img_url;
            if ($county_name == "All" && $town_id == "All" && $business_type == "All" && $business_sector == "All") {
                $scope.all_members = resData.all_members;
                $scope.all_members_count = resData.all_members_count;
            } else if ($county_name != "All" || $town_id != "All" || $business_type != "All" || $business_sector != "All") {
                $scope.search_all_members = resData.all_members;
                $scope.search_all_members_count = resData.all_members_count;
            }
            if ($scope.all_members_count > 10 || $scope.search_all_members_count > 10) {
                $scope.noMoreAllMembersAvailable = false;
            } else {
                $scope.noMoreAllMembersAvailable = true;
            }
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
        $scope.all_members_start = $scope.all_members_start + 10;
        $scope.all_members_limit = $scope.all_members_start + 10;
    };
    $scope.all_members_start = 10;
    $scope.all_members_limit = 10;
    $scope.loadMoreAllMembersTest = function (county_name, town_id, business_type, business_sector) {
        //console.log('loadMoreAllMembersTest ' + $scope.query);
        Data.send({
            api_key: api_key,
            start: $scope.all_members_start,
            count: $scope.all_members_limit,
            county_name: county_name,
            town_id: town_id,
            business_type: business_type,
            business_sector: business_sector,
            search: $scope.query
        }, 'getAllMembers').then(function (res) {
            $scope.all_members_start = $scope.all_members_start + 10;
            $scope.all_members_limit = $scope.all_members_start + 10;
            $scope.img_url = res.img_url;
            $scope.all_members_count = res.all_members_count;
            $scope.all_members = $scope.all_members.concat(JSON.parse(JSON.stringify(res.all_members)));
            if ($scope.all_members.length >= $scope.all_members_count) {
                $scope.noMoreAllMembersAvailable = true;
            } else {
                $scope.noMoreAllMembersAvailable = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.getAllMembers();

    var re_start = 0,
        re_limit = 10;
    $scope.req_more = false;

    $scope.allRequests = function () {
        re_start = 0;
        re_limit = 10;
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            start: re_start,
            count: re_limit,
            search: $scope.query
        }, 'friendRequestList').then(function (res) {
            $scope.requests = res.friend_requests;
            $scope.request_count = res.request_count;

            if (res.request_count > 10) {
                $scope.req_more = true;
            }

            if ($scope.navigate_from == 'notifications') {
                $scope.readNotifications($scope.not_type, $scope.readid);
            }
            $ionicLoading.hide();
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    $scope.loadMoreAllRequests = function () {

        re_start = re_start + re_limit;
        re_limit = 10;

        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            start: re_start,
            count: re_limit,
            search: $scope.query
        }, 'friendRequestList').then(function (res) {

            $scope.request_count = res.request_count;


            if (res.success != 0) {
                if ($scope.requests.length >= res.request_count) {
                    $scope.req_more = false;
                }
                $scope.requests = $scope.requests.concat(JSON.parse(JSON.stringify(res)).friend_requests);
            } else {
                $scope.req_more = false;
            }


            $scope.$broadcast('scroll.infiniteScrollComplete');


            $ionicLoading.hide();
            $ionicScrollDelegate.resize();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };



    $scope.allRequests();
    $scope.networkRefresh = function (var3) {
        if (var3 == 1) {
            $scope.getFriends();
        }
        if (var3 == 2) {
            $scope.getAllMembers();
        }
        if (var3 == 3) {
            $scope.allRequests();
        }
    };

    $scope.getSearchValue = function (value, stat) {

        $scope.query = value;

        if (stat == 1) {
            $scope.getFriends();
        }
        if (stat == 2) {
            $scope.getAllMembers();
        }
        if (stat == 3) {
            $scope.allRequests();
        }


    };

    $scope.navigateToFriendsProfile = function (friend_id){
        $state.go('app.friends_profile', {
            friendid: friend_id,
        });
    }

    function generateRandom(min, max) {
        var num = Math.floor(Math.random() * (max - min + 1)) + min;
        return (num === 8 || num === 15) ? generateRandom(min, max) : num;
    }
    $scope.moreShocialShareAll = function (name, src_url) {
        $ionicLoading.show();

        window.plugins.socialsharing.share(name, null, null, src_url + "?v=1", function (success) {
            $ionicLoading.hide();
            if (success == true)
                $scope.showSuccess('Successfully shared');
        }, function (error) {
            $ionicLoading.hide();
            $scope.showSuccess(error);
        });
    };
    $scope.facebookShareMembers = function (company_name, member_id) {
        var gen_mem_id = company_name + '.' + member_id;
        var url = 'https://www.thebusinessclub.com/profile/' + gen_mem_id;
        window.plugins.socialsharing.shareViaFacebook('para one..', null /* img */ , url, null, function (errormsg) {
            // window.open('https://www.facebook.com/sharer.php?s=100&&p[caption]=dasads&p[url]='.url, '_system');
        });
    };
    $scope.twitterShareMembers = function (company_name, member_id) {
        var gen_mem_id = company_name + '.' + member_id;
        var url = 'https://www.thebusinessclub.com/profile/' + gen_mem_id;
        window.plugins.socialsharing.shareViaTwitter(null, null /* img */ , url, null, function (errormsg) {
            window.open(url, '_system');
        });
    };
    $scope.linkedinShareMembers = function (company_name, member_id) {
        var gen_mem_id = company_name + '.' + member_id;
        var url = 'https://www.thebusinessclub.com/profile/' + gen_mem_id;
        $scope.moreShocialShareAll(company_name, url);
    };
    $scope.whatsappShareMembers = function (company_name, member_id) {
        var gen_mem_id = company_name + '.' + member_id;
        var url = 'https://www.thebusinessclub.com/profile/' + gen_mem_id;
        window.plugins.socialsharing.shareViaWhatsApp(null, null /* img */ , url, null, function (errormsg) {
            $scope.showError("Cannot Share. Please try again later!");
        });
    };
    $scope.sendSMSMembers = function (company_name, member_id, company_name_share) {
        var gen_mem_id = company_name + '.' + member_id;
        var url = 'https://www.thebusinessclub.com/profile/' + gen_mem_id;
        window.plugins.socialsharing.shareViaSMS(url);
    };
    $scope.linkedinShareAds = function (product, name) {
        var random = generateRandom(111111, 999999);
        var gen_pro_id = random + product + random;
        var url = 'https://www.thebusinessclub.com/order/' + gen_pro_id;
        var share_url = 'https://www.linkedin.com/shareArticle?mini=true&url=https://www.thebusinessclub.com/dev366/order/161372193';
        $scope.moreShocialShareAll(name, url);
    };
    $scope.sendFriendRequest = function (id, sent_from) {
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            friend_id: id
        }, 'friendRequestSends').then(function (res) {
            if (res.success == 1) {

                /* if ($scope.all_members != null && $scope.all_members != undefined) {
                 angular.forEach($scope.all_members, function (value, key) {
                 
                 if (id == $scope.all_members[key].id) {
                 $scope.all_members[key].f_status = "Request Sent";
                 //console.log('send');
                 }
                 
                 });
                 
                 // //console.log($rootScope.all_members);
                 }
                 
                 
                 
                 if ($scope.friends != null && $scope.friends != undefined) {
                 
                 angular.forEach($scope.friends, function (value, key) {
                 
                 if (id == $scope.friends[key].id) {
                 $scope.friends[key].f_status = "Request Sent";
                 ////console.log($rootScope.connections[key].id);
                 }
                 
                 
                 
                 });
                 } */

                var alertPopup = $ionicPopup.alert({
                    title: 'Request successfully sent',
                    template: ''
                });
                if (sent_from == "allConnections") {
                    $scope.seeMoreFriends();
                }
                if (sent_from == "friendsProfile") {
                    $rootScope.viewFriendsProfile();
                }
                if (sent_from == "localAreaConnections") {
                    $scope.localConnections();
                }
                if (sent_from == "whoLikedMyPost") {
                    $scope.openWhoLikePost($stateParams.postid);
                }
                if (sent_from == "whoViewedMyProfile") {
                    $scope.openWhoViewMyFProfile();
                }
                if (sent_from == "allMembers") {
                    $scope.getAllMembers();
                }
            } else {}
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.acceptFriendRequest = function (f_id, sent_from) {
        Data.send({
            api_key: api_key,
            s_id: f_id
        }, 'acceptFriendRequest').then(function (res) {
            if (res.success == 1) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Member request accepted successfully',
                    template: ''
                });
                if (sent_from == "allConnections") {
                    $scope.seeMoreFriends();
                }
                if (sent_from == "friendsProfile") {
                    $rootScope.viewFriendsProfile();
                }
                if (sent_from == "localAreaConnections") {
                    $scope.localConnections();
                }
                if (sent_from == "myConnections") {
                    /*$scope.closeConnRequests(); */
                    $scope.getFriends();
                }
                if (sent_from == "whoLikedMyPost") {
                    $scope.openWhoLikePost($stateParams.postid);
                }
                if (sent_from == "whoViewedMyProfile") {
                    $scope.openWhoViewMyFProfile();
                }
                if (sent_from == "allMember") {
                    $scope.getAllMembers();
                }
                if (sent_from == "myRequests") {
                    $scope.allRequests();
                    /* $scope.getFriends(); */
                }
            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.rejectFriendRequest = function (f_id, sent_from) {
        Data.send({
            api_key: api_key,
            s_id: f_id
        }, 'rejectFriendRequest').then(function (res) {
            if (res.success == 1) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Friend request rejected successfully',
                    template: ''
                });
                if (sent_from == "allConnections") {
                    $scope.seeMoreFriends();
                }
                if (sent_from == "friendsProfile") {
                    $rootScope.viewFriendsProfile();
                }
                if (sent_from == "localAreaConnections") {
                    $scope.localConnections();
                }
                if (sent_from == "myConnections") {
                    $scope.closeConnRequests();
                    $scope.getFriends();
                }
                if (sent_from == "whoLikedMyPost") {
                    $scope.openWhoLikePost($stateParams.postid);
                }
                if (sent_from == "whoViewedMyProfile") {
                    $scope.openWhoViewMyFProfile();
                }
                if (sent_from == "allMember") {
                    $scope.getAllMembers();
                }
                if (sent_from == "myRequests") {
                    $scope.allRequests();
                }
            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.cancelFriendRequest = function (id, sent_from) {
        Data.send({
            api_key: api_key,
            friend_id: id
        }, 'cancelFriendRequest').then(function (res) {
            if (res.success == 1) {


                /*  if ($scope.all_members != null && $scope.all_members != undefined) {
                 angular.forEach($scope.all_members, function (value, key) {
                 
                 if (id == $scope.all_members[key].id) {
                 $scope.all_members[key].f_status = "Connect";
                 }
                 
                 });
                 
                 // //console.log($rootScope.all_members);
                 }
                 
                 
                 
                 if ($scope.friends != null && $scope.friends != undefined) {
                 
                 angular.forEach($scope.friends, function (value, key) {
                 
                 if (id == $scope.friends[key].id) {
                 $scope.friends[key].f_status = "Connect";
                 ////console.log($rootScope.connections[key].id);
                 }
                 
                 
                 
                 });
                 } */

                var alertPopup = $ionicPopup.alert({
                    title: 'Request cancelled',
                    template: ''
                });
                if (sent_from == "allConnections") {
                    $scope.seeMoreFriends();
                }
                if (sent_from == "friendsProfile") {
                    $rootScope.viewFriendsProfile();
                }
                if (sent_from == "localAreaConnections") {
                    $scope.localConnections();
                }
                if (sent_from == "whoLikedMyPost") {
                    $scope.openWhoLikePost($stateParams.postid);
                }
                if (sent_from == "whoViewedMyProfile") {
                    $scope.openWhoViewMyFProfile();
                }
                if (sent_from == "allMembers") {
                    $scope.getAllMembers();
                }
            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.openFilterAllMembers = function () {
        $ionicLoading.show();
        $ionicModal.fromTemplateUrl('templates/modal/filter_all_members.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalFilterAllMembers = modal;
            $scope.modalFilterAllMembers.show();
            $scope.f1 = [];
            Data.send({}, 'getCounties').then(function (res) {
                $scope.counties = res.counties;
                if (res.counties.length <= 0) {
                    $scope.enable_town = false;
                } else {
                    $scope.enable_town = true;
                }
                $scope.flaggetCounties = true;
                $scope.f1.push({
                    value: true
                });
            }, function (x) {
                $scope.showError("Check your connection!");
            });
            Data.send({}, 'getBusinessTypeAndSector').then(function (res1) {
                $scope.business_types = res1.business_types;
                $scope.business_sectors = res1.business_sectors;
                $scope.flagTypeAndSector = true;
                $scope.f1.push({
                    value: true
                });
            }, function (x) {
                $scope.showError("Check your connection!");
            });
            $scope.$watch('flag', function () {
                $ionicLoading.hide();
            }, true);
        });
    };
    $scope.closeFilterAllMembers = function () {
        $scope.modalFilterAllMembers.hide();
    };
    ionic.material.ink.displayEffect();
});
app.controller('AllConnectionCtrl', function ($scope, $ionicLoading, $ionicSlideBoxDelegate, $ionicScrollDelegate, $stateParams, Data, TbcAuthService) {
    api_key = window.localStorage.getItem('userkey');
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = true;
    });
    var id = $stateParams.friendid;
    $ionicLoading.show();
    $scope.seeMoreFriends = function () {
        Data.send({
            api_key: api_key,
            friend_id: $stateParams.friendid
        }, 'seeMoreFriends').then(function (res) {
            $scope.my_friends = res.friends;
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.seeMoreFriends();
    $ionicSlideBoxDelegate.update();
    $ionicScrollDelegate.scrollTop();
    ionic.material.ink.displayEffect();
});
app.controller('ManageAdsCtrl', function ($scope, $state, $ionicLoading, Data, TbcAuthService, $stateParams, $controller) {
    $controller('AdsProductCtrl', {
        $scope: $scope
    });
    api_key = window.localStorage.getItem('userkey');
    var order_id = $stateParams.orderId;
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = true;
    });
    $scope.getAdsEnqueries = function (action) {
        Data.send({
            api_key: api_key,
            action: action
        }, 'adsEnquiry').then(function (res) {
            if (action == "complete") {
                $scope.enable_complete = false;
                $scope.complete_button_class = 'active';
                $scope.pending_button_class = '';
            } else if (action == "pending") {
                $scope.enable_complete = true;
                $scope.pending_button_class = 'active';
                $scope.complete_button_class = '';
            }
            $ionicLoading.hide();
            $state.go('app.enquiryAds');
            $scope.enquiries = res.products;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.getMyEnqueries = function (action) {
        Data.send({
            api_key: api_key,
            action: action
        }, 'myOrders').then(function (res) {
            if (action == "complete") {
                $scope.enable_complete = false;
                $scope.complete_button_class = 'active';
                $scope.pending_button_class = '';
            } else if (action == "pending") {
                $scope.enable_complete = true;
                $scope.pending_button_class = 'active';
                $scope.complete_button_class = '';
            }
            $ionicLoading.hide();
            $state.go('app.myOrders');
            $scope.enquiries = res.products;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.myOrdersDeleteAction = function (order_id) {
        Data.send({
            api_key: api_key,
            id: order_id
        }, 'pendingMyOrderDelete').then(function (res) {
            if (res.success == 1) {
                $scope.getAdsEnqueries('pending');
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.askOrderQuestions = function (enquiryDetails) {
        Data.send({
            api_key: api_key,
            order_id: order_id,
            msg_user: enquiryDetails.question
        }, 'pendingOrderChat').then(function (res) {
            $scope.viewMyOrderEnquiry();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    ionic.material.ink.displayEffect();
});
app.controller('ManageSingleAdsCtrl', function ($scope, $state, $stateParams, $ionicSlideBoxDelegate, $ionicLoading, Data, TBC, TbcAuthService) {
    $ionicLoading.show();
    api_key = window.localStorage.getItem('userkey');
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = true;
    });
    $ionicLoading.show();
    var order_id = $stateParams.orderId;
    $scope.getAdsEnqueries = function (action) {
        Data.send({
            api_key: api_key,
            action: action
        }, 'adsEnquiry').then(function (res) {
            if (action == "complete") {
                $scope.enable_complete = false;
                $scope.complete_button_class = 'active';
                $scope.pending_button_class = '';
            } else if (action == "pending") {
                $scope.enable_complete = true;
                $scope.pending_button_class = 'active';
                $scope.complete_button_class = '';
            }
            $ionicLoading.hide();
            $scope.enquiries = res.products;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.getMyEnqueries = function (action) {
        Data.send({
            api_key: api_key,
            action: action
        }, 'myOrders').then(function (res) {
            if (action == "complete") {
                $scope.enable_complete = false;
                $scope.complete_button_class = 'active';
                $scope.pending_button_class = '';
            } else if (action == "pending") {
                $scope.enable_complete = true;
                $scope.pending_button_class = 'active';
                $scope.complete_button_class = '';
            }
            $ionicLoading.hide();
            $scope.enquiries = res.products;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.viewMyOrderEnquiry = function () {
        Data.send({
            api_key: api_key,
            order_id: order_id
        }, 'pendingOrderChatHistry').then(function (res) {
            $scope.productDetails = res.product;
            $scope.order_chat_list_count = res.order_chat_list_count;
            $scope.order_chat_list = res.order_chat_list;
            $ionicSlideBoxDelegate.update();
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.viewMyOrderEnquiry();
    $scope.askOrderQuestions = function (enquiryDetails) {
        Data.send({
            api_key: api_key,
            order_id: order_id,
            msg_user: enquiryDetails.question
        }, 'pendingOrderChat').then(function (res) {
            $scope.viewMyOrderEnquiry();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.myOrdersDeleteAction = function (order_id) {
        Data.send({
            api_key: api_key,
            id: order_id
        }, 'pendingMyOrderDelete').then(function (res) {
            if (res.success == 1) {
                $scope.getAdsEnqueries('pending');
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    ionic.material.ink.displayEffect();
});
app.controller('SettingCtrl', function ($scope, $ionicLoading, Data, $ionicModal) {
    $scope.data = {};
    api_key = window.localStorage.getItem('userkey');
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = false;
        $scope.settings = function () {
            Data.send({
                api_key: api_key
            }, 'userView').then(function (res) {
                if (res.success == 1) {
                    $scope.userDetails = res.user;
                }
                $scope.$broadcast('scroll.refreshComplete');
            }, function (x) {
                $scope.showError("Check your connection!");
            });
        };
        $scope.settings();
    });
    $scope.updateTBCPrivacy = function (option, type) {
        Data.send({
            api_key: api_key,
            option: option,
            type: type
        }, 'updateTBCPrivacy').then(function (res) {
            if (option == 0) {
                $scope.showSuccess('Profile is been visible for public');
            } else if (option == 1) {
                $scope.showSuccess('Profile is been invisible for public');
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.userPasswordChange = function (password, confirmPassword) {
        if (password && confirmPassword) {
            Data.send({
                api_key: api_key,
                password: password
            }, 'userPasswordChange').then(function (res) {
                if (res.success == 1) {
                    $scope.showSuccess('Password is changed successfully');
                    $scope.closeChangePassword();
                    $scope.data = "";
                }
            }, function (x) {
                $scope.showError("Check your connection!");
            });
        } else {
            $scope.showSuccess('New password and Confirm Password are required');
        }
    };
    $ionicModal.fromTemplateUrl('templates/modal/change_password.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalChangePassword = modal;
    });
    $scope.openChangePassword = function () {
        $scope.modalChangePassword.show();
    };
    $scope.closeChangePassword = function () {
        $scope.modalChangePassword.hide();
        $scope.data = "";
    };
    ionic.material.ink.displayEffect();
});
app.controller('MessageChatCtrl', function ($scope, $timeout, $rootScope, $ionicLoading, $ionicScrollDelegate, $stateParams, Data, TbcAuthService, $interval) {
    $ionicLoading.show();
    $scope.msg_body = "";

    $scope.subject_id = "";

    api_key = window.localStorage.getItem('userkey');
    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {});
    $rootScope.chat_history = [];
    if ($stateParams.fid)
        $scope.friend_id = $stateParams.fid;
    if ($stateParams.sid)
        $scope.subject_id = $stateParams.sid;
    if ($stateParams.chatname)
        $scope.chatname = $stateParams.chatname;
    if ($stateParams.chstat)
        $scope.chstat = $stateParams.chstat;
    if ($stateParams.chread)
        $scope.chread = $stateParams.chread;
    if ($stateParams.sen)
        $scope.sen = $stateParams.sen;
    var start = 0,
        count = 10;
    $scope.more = false;
    // var friendCheck = [];
    // $scope.friendCheck = false;
    if ($stateParams.fid && $scope.friendList) {
        friendCheck = $scope.friendList.filter(function (a) {
            return a.id == $stateParams.fid;
        });
        if (friendCheck.length && friendCheck.length > 0) {
            $scope.friendCheck = true;
        }
    }

    //alert($scope.friendCheck);
    $scope.getFriendChat = function (id, fid, type, chread, sen) {
        start = 0;
        count = 10;
        Data.send({
            api_key: api_key,
            start: start,
            count: count,
            subject_id: id,
            user_id: fid,
            type: type,
            chread: chread,
            sen: sen
        }, 'getMsgHistory').then(function (res) {
            if (res.success === 1 && res.all_messages.length >= 1) {
                $rootScope.chat_history = res.all_messages;
                if (res.count_message > 10)
                    $scope.more = true;
            } else {}
            $ionicLoading.hide();
            $ionicScrollDelegate.resize();
            // $ionicScrollDelegate.scrollBottom();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.clearSearch = function () {
        $scope.searchAll = null;
    };

    $scope.getFriendChat($scope.subject_id, $scope.friend_id, $scope.chstat, $scope.chread, $scope.sen);

    $scope.sendMessage = function (msg, friend, subject_id, chatby, ele) {

        $ionicLoading.show({
            template: '<ion-spinner icon="dots"></ion-spinner><br>Sending...'
        });
        Data.send({
            api_key: api_key,
            friend_id: friend,
            msg_body: msg,
            subject_id: subject_id,
            sentBy: chatby,
            is_reply: 1
        }, 'sendmessage').then(function (res) {
            if (res.success == 1) {
                var message = {
                    toId: friend,
                    text: msg
                };

                // $scope.msg_body = '';

                // console.log($rootScope.chat_history);

                document.getElementById('msg_body').value = "";
                $scope.getFriendChat($scope.subject_id, $scope.friend_id, $scope.chstat, $scope.chread, $scope.sen);
                // message.id = res.id;
                // message.subject_id = $scope.subject_id;
                // message.contact_name = 'You';
                // message.sent_by = 1;
                // message.send_time = 'now';
                // message.date_ = new Date().getTime();
                // message.message_body = msg;
                // message.userId = 1;
                // message.img_url = $rootScope.userImagewithUrl;
                // message.pic = $rootScope.userImagewithUrl;
                // $rootScope.chat_history.push(message);

                // msg = "";

                // $timeout(function () {
                    // viewScroll.scrollBottom(true);
                    // $ionicScrollDelegate.scrollBottom();
                // }, 0);
            } else {}
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
            $ionicLoading.hide();
        });
    };
    $scope.getFriendChatLoadmore = function (id, fid, type, chread, sen) {
        start = start + count;
        count = 10;
        Data.send({
            api_key: api_key,
            start: start,
            count: count,
            subject_id: id,
            user_id: fid,
            type: type,
            chread: chread,
            sen: sen
        }, 'getMsgHistory').then(function (res) {
            if (res.success === 1) {
                if ($rootScope.chat_history.length >= res.count_message) {
                    $scope.more = false;
                }
                $rootScope.chat_history = $rootScope.chat_history.concat(JSON.parse(JSON.stringify(res)).all_messages);
            } else {
                $scope.more = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    // $rootScope.$watch('new_individual_msg', function(newValue, oldValue) {

    //     console.log($scope.subject_id);




    //     // $scope.getFriendChat($scope.subject_id, $scope.friend_id, $scope.chstat, $scope.chread, $scope.sen);
    // });

    ionic.material.ink.displayEffect();
});
app.controller('ViewMemberEnquiryCtrl', function ($scope, $interval, $ionicSlideBoxDelegate, $stateParams, $ionicLoading, Data, TBC, TbcAuthService) {

    $scope.readNotifications = function (type, id) {
        Data.send({
            api_key: api_key,
            type: type,
            id: id
        }, 'userNotificationUpdate').then(function (res) {}, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.viewMemberEnquiry = function () {
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            order_id: $stateParams.orderId
        }, 'pendingEnquiryChatHistry').then(function (res) {
            $scope.productDetails = res.product;
            $scope.order_chat_list_count = res.order_chat_list_count;
            $scope.order_chat_list = res.order_chat_list;
            if ($stateParams.navigate_from == "notifications") {
                $scope.readNotifications($stateParams.not_type, $stateParams.readid);
            }
            $ionicLoading.hide();
            $ionicSlideBoxDelegate.update();
            $scope.$broadcast('scroll.refreshComplete');
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.askEnquiryQuestions = function (enquiryDetails) {
        Data.send({
            api_key: api_key,
            order_id: $stateParams.orderId,
            msg_user: enquiryDetails.question
        }, 'pendingEnquiryChat').then(function (res) {
            $scope.viewMemberEnquiry();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };

    function callAtChatInterval() {
        var tmp_order_id = $stateParams.orderId;
        Data.send({
            api_key: api_key,
            order_id: $stateParams.orderId
        }, 'pendingEnquiryChatHistry').then(function (res) {
            $scope.order_chat_list_count = res.order_chat_list_count;
            $scope.order_chat_list = res.order_chat_list;
            $scope.tmp_order_chat_list_count = res.order_chat_list_count;
            $scope.tmp_order_chat_list = res.order_chat_list;
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    }
    var stop;
    $scope.chatMemberEnquiry = function () {};
    $scope.$on("$ionicView.enter", function (event, data) {
        stop = $interval(callAtChatInterval, 5000, $scope.chatIntrevel);
    });
    $scope.$on("$ionicView.leave", function (event, data) {
        if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
        }
    });
    $scope.$on('$destroy', function () {
        if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
        }
    });
    $scope.viewMemberEnquiry();
    ionic.material.ink.displayEffect();
});
app.controller('WhoViewCtrl', function ($scope, $ionicLoading, Data, TBC, TbcAuthService, $ionicPopup, $timeout) {
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        viewData.enableBack = true;
    });
    var friends_wall_start = 0;
    var friends_wall_limit = 10;

    $scope.profileSearch = '';

    $scope.noMoreUserViewersAvailable = false;
    $scope.viewUserViewers = function () {
        friends_wall_start = 0;
        friends_wall_limit = 10;
        Data.send({
            api_key: api_key,
            start: friends_wall_start,
            count: friends_wall_limit,
            search: $scope.profileSearch
        }, 'userViewMore').then(function (res) {
            if (res.num_of_view >= 10) {
                $scope.noMoreUserViewersAvailable = true;
            } else {
                $scope.noMoreUserViewersAvailable = false;
            }
            $scope.user_viewss = res.user_views;
            $scope.num_of_view = res.num_of_view;
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };


    $scope.loadMoreUserViewers = function () {
        friends_wall_start = friends_wall_start + 10;
        friends_wall_limit = friends_wall_start + 10;
        Data.send({
            api_key: api_key,
            start: friends_wall_start,
            count: friends_wall_limit,
            search: $scope.profileSearch
        }, 'userViewMore').then(function (res) {
            $scope.user_viewss = $scope.user_viewss.concat(JSON.parse(JSON.stringify(res.user_views)));

            if ($scope.user_viewss.length >= res.num_of_view) {
                $scope.noMoreUserViewersAvailable = true;
            } else {
                $scope.noMoreUserViewersAvailable = false;
            }


            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.viewUserViewers();

    $scope.profileOnChange = function (text) {
        $scope.profileSearch = text;
        $scope.viewUserViewers();
    };

    $scope.sendFriendRequest = function (id, sent_from) {
        $ionicLoading.show();
        Data.send({
            api_key: api_key,
            friend_id: id
        }, 'friendRequestSends').then(function (res) {
            if (res.success == 1) {

                if ($scope.user_viewss != undefined) {
                    angular.forEach($scope.user_viewss, function (value, key) {

                        if (id == $scope.user_viewss[key].friend_id) {
                            $scope.user_viewss[key].f_status = "Request Sent";
                            //console.log('send');
                        }

                    });

                    // //console.log($rootScope.all_members);
                }




                // $scope.getAllMembers();
                $ionicLoading.hide();
                $scope.showSuccess('Request successfully sent');

            } else {
                $ionicLoading.hide();
            }

        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.acceptFriendRequest = function (f_id, sent_from) {
        Data.send({
            api_key: api_key,
            s_id: f_id
        }, 'acceptFriendRequest').then(function (res) {
            if (res.success == 1) {


                if ($scope.user_viewss != undefined) {
                    angular.forEach($scope.user_viewss, function (value, key) {

                        if (f_id == $scope.user_viewss[key].friend_id) {
                            $scope.user_viewss[key].f_status = "Disconnect";
                            //console.log('send');
                        }

                    });

                    // //console.log($rootScope.all_members);
                }

                $scope.showSuccess('Member request accepted successfully');

            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.rejectFriendRequest = function (f_id, sent_from) {
        Data.send({
            api_key: api_key,
            s_id: f_id
        }, 'rejectFriendRequest').then(function (res) {
            if (res.success == 1) {

                if ($scope.user_viewss != undefined) {
                    angular.forEach($scope.user_viewss, function (value, key) {

                        if (f_id == $scope.user_viewss[key].friend_id) {
                            $scope.user_viewss[key].f_status = "Connect";
                            //console.log('send');
                        }

                    });

                    // //console.log($rootScope.all_members);
                }

                $scope.showSuccess('Friend request rejected successfully');

            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.cancelFriendRequest = function (id, sent_from) {
        Data.send({
            api_key: api_key,
            friend_id: id
        }, 'cancelFriendRequest').then(function (res) {
            if (res.success == 1) {




                if ($scope.user_viewss != undefined) {
                    angular.forEach($scope.user_viewss, function (value, key) {

                        if (id == $scope.user_viewss[key].friend_id) {
                            $scope.user_viewss[key].f_status = "Connect";
                            //console.log('send');
                        }

                    });


                }


            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.userDisconnect = function (f_id, sent_from) {
        var confirmDiscon = $ionicPopup.confirm({
            title: 'Are you sure you want to disconnect ?',
            template: ''
        });
        confirmDiscon.then(function (res) {
            if (res) {

                if ($scope.user_viewss != undefined) {
                    angular.forEach($scope.user_viewss, function (value, key) {

                        if (f_id == $scope.user_viewss[key].friend_id) {
                            $scope.user_viewss[key].f_status = "Connect";
                            //console.log('send');
                        }

                    });


                }
                $scope.disconnectFriend(f_id, sent_from);
            } else {}
        });
        $timeout(function () {
            confirmDiscon.close();
        }, 10000);
    };
    $scope.disconnectFriend = function (f_id, sent_from) {
        Data.send({
            api_key: api_key,
            friend_id: f_id
        }, 'disconnectFriend').then(function (res) {
            if (res.success == 1) {
                $scope.showSuccess('Friend disconnected successfully');

            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };


});
app.controller('ReuseWallCtrl', function ($scope, $cordovaFileTransfer, $cordovaFile, $cordovaCamera, $timeout, $ionicPopup, $state, $rootScope, $ionicActionSheet, $stateParams, $ionicPopover, $ionicModal, $ionicLoading, Data, TBC, TbcAuthService, $cordovaSocialSharing) {
    /** 
     * Home/Profile Wall Reuse module Configurations
     * ===============================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer    : Mohamed Rimsan - rimsnet@gmail.com
     * Controller   : ReuseWallCtrl
     * Main Method  : app.controller('ReuseWallCtrl',function(......){});
     * Reuse Method : $controller('ReuseWallCtrl')
     * Scope Method :              
     * Date         : 2017-04-20
     * ===============================================================
     * */
    var numImageSelect = 5;
    var images = [];
    $scope.serverImage = [];
    $scope.img = images;
    $scope.imgsDisplay = [];
    var incre = 0;



    $scope.openWhoLikePost = function (post_id) {
        $ionicLoading.show();
        $ionicModal.fromTemplateUrl('templates/who_like_mypost.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalWhoLikePost = modal;
            Data.send({
                api_key: api_key,
                wall_id: post_id
            }, 'getSinglePostLikes').then(function (res) {
                $scope.liked_users = res.like_list;
                $scope.num_of_like = res.num_of_like - 1;
                $scope.modalWhoLikePost.show();
                $ionicLoading.hide();
            }, function (x) {
                $scope.showError("Check your connection!");
            });
        });
    };
    $scope.closeWhoLikePost = function () {
        $scope.modalWhoLikePost.hide();
    };
    $scope.wallPostEditOptionSingle = function ($event, type, id, index1) {
        $scope.passid = id;
        $scope.editCommentType = type;
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Edit'
            }, {
                text: '<span class="text-red"> Delete </span>'
            }],
            titleText: 'Post Option',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    $scope.openPostApp(type, id, index1);
                } else if (index == 1) {
                    $scope.deletePost(type, id, index1);
                }
                return true;
            }
        });
    };
    $scope.openPopover = function ($event, type, id, index) {
        $scope.popover = $ionicPopover.fromTemplateUrl('templates/popover.html', {
            scope: $scope
        }).then(function (popover) {
            $scope.popover = popover;
            $scope.passid = id;
            $scope.editCommentType = type;
            $scope.index = index;
            $scope.popover.show($event);
        });
    };
    $scope.closePopover = function () {
        $scope.popover.hide();
    };
    $scope.removeUploadImageMain = function (item) {
        var index = $scope.img.indexOf(item);
        $scope.img.splice(index, 1);
        numImageSelect++;
    };
    $scope.removeSelectedImageMain = function (item) {
        var index = $scope.postImages.indexOf(item);
        $scope.postImages.splice(index, 1);
        if (numImageSelect <= 5) {
            numImageSelect++;
        } else {}
    };

    var status = '';
    $scope.getSingleWallPostForView = function () {
        Data.send({
            api_key: api_key,
            wall_id: $stateParams.postid
        }, 'singleWallbeta').then(function (res) {
            $scope.image_location_post = res.image_location_post;
            $scope.image_location_user = res.image_location_user;
            $rootScope.single_post = res.wall_posts;

            url = res.wall_posts.post_post;

            var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
            var result = url.replace(urlRegEx, "<a ng-click=\"directToPostLink('$1',\'_system\')\">$1</a>");

            $scope.name = result;

            if ($stateParams.navigate_from == "notifications") {
                $scope.readNotifications($stateParams.not_type, $stateParams.readid);
            }
            $scope.$broadcast('scroll.refreshComplete');
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.likeWallPost = function (post_id, like_status, navigate_from, hasLiked, one_post) {
        api_key = window.localStorage.getItem('userkey');
        if (like_status == "activated") {
            status = 'liked';
        } else {
            status = '';
        }
        Data.send({
            wall_post: post_id,
            like_status: status
        }, 'wallPostLike').then(function (res) {
            if (navigate_from == 'home') {
                if (!hasLiked) {
                    hasLiked = false;
                    $scope.like_display = 'Like';
                    --one_post.num_like;
                    one_post.like_test = true;
                    one_post.like_test_1 = 'Like';
                    one_post.like_status = '';
                } else {
                    hasLiked = true;
                    $scope.like_display = 'Unlike';
                    ++one_post.num_like;
                    one_post.like_test = false;
                    one_post.like_test_1 = 'Unlike';
                    one_post.like_status = 'activated';
                }
            } else if (navigate_from == 'comment') {
                if (like_status == 'activated') {
                    if ($rootScope.main_wall != null) {
                        angular.forEach($rootScope.main_wall, function (value, key) {
                            if (post_id == $rootScope.main_wall[key].wall_post_id) {
                                $rootScope.main_wall[key].num_like--;
                                $scope.like_display = 'Like';
                                $rootScope.main_wall[key].like_status = "";
                                $rootScope.main_wall[key].like_test_1 = 'Like';
                                $rootScope.main_wall[key].like_test = true;
                            }
                        });
                    }
                } else {
                    if ($rootScope.main_wall != null) {
                        angular.forEach($rootScope.main_wall, function (value, key) {
                            if (post_id == $rootScope.main_wall[key].wall_post_id) {
                                $rootScope.main_wall[key].num_like++;
                                $scope.like_display = 'Unlike';
                                $rootScope.main_wall[key].like_status = "activated";
                                $rootScope.main_wall[key].like_test_1 = 'Unlike';
                                $rootScope.main_wall[key].like_test = true;
                            }
                        });
                    }
                }
                Data.send({
                    api_key: api_key,
                    wall_id: post_id
                }, 'singleWallbeta').then(function (res) {
                    $scope.image_location_post = res.image_location_post;
                    $scope.image_location_user = res.image_location_user;
                    $rootScope.single_post = res.wall_posts;

                    url = res.wall_posts.post_post;

                    var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
                    var result = url.replace(urlRegEx, "<a ng-click=\"directToPostLink('$1',\'_system\')\">$1</a>");

                    $scope.name = result;

                    $scope.$watch("single_post", function () {});
                    if ($stateParams.navigate_from == "notifications") {
                        $scope.readNotifications($stateParams.not_type, $stateParams.readid);
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                }, function (x) {
                    $scope.showError("Check your connection!");
                });
            }
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $ionicModal.fromTemplateUrl('templates/modal/new_post.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalPosts = modal;
    });
    $scope.openPosts = function () {
        $scope.modalPosts.show();

    };
    $scope.closePosts = function () {
        $scope.modalPosts.hide();
    };
    $scope.closePost = function () {
        $scope.modalPost.hide();
        $scope.postImages = [];
        numImageSelect = 5;
        images = [];
        $scope.serverImage = [];
        $scope.img = images;
        incre = 0;
    };
    $scope.openNewPostForm = function (type, wall_post) {
        $ionicModal.fromTemplateUrl('templates/modal/new_post.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalPost = modal;
            $scope.formtype = type;
            $scope.wall_post = wall_post;
            $scope.modalPost.show();
        });
    };
    $scope.openPostApp = function (type, post_id, wall_post) {
        $scope.type = type;
        $scope.postDetails = {};
        if (type == 'edit-post' || type == 'edit-post-home' && post_id >= 1) {
            $scope.getSingleWallPost(post_id);
        }
        if (type == 'comment' && post_id >= 1) {
            $scope.postDetails.post_id = post_id;
        }
        if (type == 'edit-comment' && post_id >= 1) {
            $scope.SingleComment(post_id);
            $scope.closePopover();
            $scope.go('app.post', {
                postid: post_id
            });
            $scope.getSingleWallPostForView();
        }
        if (type == 'post') {
            $scope.postImages = {};
        }
        $scope.openNewPostForm(type, wall_post);
    };
    $scope.closePopover = function () {
        $scope.popover = $ionicPopover.fromTemplateUrl('templates/popover.html', {
            scope: $scope
        }).then(function (popover) {
            $scope.popover = popover;
            $scope.popover.hide();
        });
    };
    $scope.getSingleWallPost = function (id) {
        Data.send({
            api_key: api_key,
            wall_id: id
        }, 'singleWallbeta').then(function (res) {
            $scope.postDetails = {};
            $scope.postImages = {};
            $scope.postDetails = res.wall_posts;

            url = res.wall_posts.post_post;

            var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
            var result = url.replace(urlRegEx, "<a ng-click=\"directToPostLink('$1',\'_system\')\">$1</a>");

            $scope.name = result;

            $scope.postImages = res.wall_posts.image_list;
            $scope.image_location_post = res.image_location_post;
            $scope.postDetails.post_id = res.wall_posts.post_id;
            if ($scope.postImages != null) {
                numImageSelect = numImageSelect - $scope.postImages.length;
            }
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.SingleComment = function (id) {
        Data.send({
            api_key: api_key,
            reply_id: id
        }, 'getSingleReply').then(function (res) {
            $scope.postDetails = {};
            $scope.postDetails = res.reply_list;
            $scope.postDetails.post_id = res.reply_list.wall_post_reply_id;
            $scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.addPost = function (postDetails, type, wall_post) {
        if (type == 'post' || type == 'edit-post-home' || type == 'edit-post') {
            if (postDetails['image_list']) {
                $check_image = 'have image';
            } else {
                $check_image = 'no image';
            }
            if ($scope.img == "") {
                $upload_image = 'no image';
            } else {
                $upload_image = 'have image';
            }

            if ($upload_image == "have image" || $check_image == "have image") {
                if ($upload_image == "have image" && $check_image == "have image") {
                    $scope.uploadPicsWall('wall', postDetails);
                } else if ($upload_image == "have image") {
                    $scope.uploadPicsWall('wall', postDetails);
                } else if ($check_image == "have image") {
                    var file_ids = [];
                    angular.forEach($scope.postImages, function (value, key) {
                        this.push(value['id']);
                    }, file_ids);

                    exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
                    text1 = postDetails.comments.replace(exp, " $1");
                    exp2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
                    postDetails.comments = text1.replace(exp2, ' http://$2');

                    Data.send({
                        api_key: api_key,
                        post_txt: postDetails.comments,
                        post_id: postDetails.post_id,
                        image_ids: file_ids
                    }, 'addEditWall').then(function (res) {
                        if (type == 'edit-post-home' || type == 'post') {
                            Data.send({
                                api_key: api_key,
                                start: 0,
                                count: 10
                            }, 'userwallBeta1').then(function (res) {
                                $rootScope.main_wall = JSON.parse(JSON.stringify(res)).wall_posts;
                                $scope.image_location_post = res.image_location_post;
                                $scope.image_location_user = res.image_location_user;
                                $scope.user_image = res.user_image;
                                if (res.wall_post_count >= 10)
                                    $scope.more = true;
                                $scope.$broadcast('scroll.refreshComplete');
                            }, function (x) {
                                $scope.showError("Check your connection!");
                            });
                            $timeout(function () {
                                $scope.closePost();
                                $ionicLoading.hide();
                                $scope.showSuccess('Successfully posted');
                            });
                        } else if (type == 'edit-post') {
                            $scope.getSingleWallPostForView();
                            $scope.showSuccess('Successfully posted');
                        }
                    }, function (x) {
                        $scope.showError("Check your connection!");
                    });
                }
            } else if ($upload_image == "no image" && $check_image == "no image") {
                if ($scope.postDetails.comments == '' || $scope.postDetails.comments == null) {
                    var confirmPopup = $ionicPopup.confirm({
                        title: "You didn't type anything, we need something!",
                        buttons: [{
                            text: 'OK',
                            type: 'button-positive',
                            onTap: function (e) {
                                confirmPopup.close();
                            }
                        }]
                    });
                } else {

                    $ionicLoading.show({
                        template: '<ion-spinner icon="dots"></ion-spinner><br>Posting'
                    });

                    exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
                    text1 = postDetails.comments.replace(exp, " $1");
                    exp2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
                    postDetails.comments = text1.replace(exp2, ' http://$2');

                    ////console.log(postDetails.comments);

                    Data.send({
                        api_key: api_key,
                        post_txt: postDetails.comments,
                        post_id: postDetails.post_id,
                        image_ids: null
                    }, 'addEditWall').then(function (res) {
                        $scope.closePost();
                        if (type == 'edit-post-home' || type == 'post') {
                            Data.send({
                                api_key: api_key,
                                start: 0,
                                count: 10
                            }, 'userwallBeta1').then(function (res) {
                                $rootScope.main_wall = JSON.parse(JSON.stringify(res)).wall_posts;
                                $scope.image_location_post = res.image_location_post;
                                $scope.image_location_user = res.image_location_user;
                                $scope.user_image = res.user_image;
                                if (res.wall_post_count >= 10)
                                    $scope.more = true;
                                $scope.$broadcast('scroll.refreshComplete');
                                $timeout(function () {
                                    $scope.closePost();
                                    $ionicLoading.hide();
                                    $scope.showSuccess('Successfully posted');
                                });
                            }, function (x) {
                                $scope.showError("Check your connection!");
                            });
                        } else if (type == 'edit-post') {
                            $scope.getSingleWallPostForView();
                            $scope.showSuccess('Successfully posted');
                        }
                        $ionicLoading.hide();
                    }, function (x) {
                        $scope.showError("Check your connection!");
                    });
                }
            }
        }
        if (type == 'comment') {
            $ionicLoading.show();

            exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            text1 = postDetails.comments.replace(exp, " $1");
            exp2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
            postDetails.comments = text1.replace(exp2, ' http://$2');

            Data.send({
                api_key: api_key,
                comment_box: postDetails.comments,
                post_id: postDetails.post_id
            }, 'addWallPostReply').then(function (res) {
                if(res.success == 1){
                    Data.send({
                        api_key: api_key,
                        wall_id: postDetails.post_id
                    }, 'singleWallbeta').then(function (res) {
                        $scope.image_location_post = res.image_location_post;
                        $scope.image_location_user = res.image_location_user;
                        $rootScope.single_post = res.wall_posts;

                        url = res.wall_posts.post_post;

                        var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
                        var result = url.replace(urlRegEx, "<a ng-click=\"directToPostLink('$1',\'_system\')\">$1</a>");

                        $scope.name = result;

                        $ionicLoading.hide();
                        $scope.$broadcast('scroll.refreshComplete');
                    }, function (x) {
                        $scope.showError("Check your connection!");
                    });

                }
                $scope.closePost();
                if ($rootScope.main_wall != null) {
                    angular.forEach($rootScope.main_wall, function (value, key) {
                        if (postDetails.post_id == $rootScope.main_wall[key].wall_post_id) {
                            $rootScope.main_wall[key].no_of_reply++;
                            if ($rootScope.main_wall[key].no_of_reply > 1) {
                                $rootScope.main_wall[key].comment = "comments";
                            } else {
                                $rootScope.main_wall[key].comment = "comment";
                            }
                        }
                    });
                }
                if ($scope.single_post != null) {
                    angular.forEach($scope.single_post, function (value, key) {
                        if (postDetails.post_id == $scope.single_post[key].wall_post_id) {
                            $scope.single_post[key].no_of_reply++;
                            if ($scope.single_post[key].no_of_reply > 1) {
                                $scope.single_post[key].comment = "comments";
                            } else {
                                $scope.single_post[key].comment = "comment";
                            }
                        }
                    });
                }
            }, function (x) {
                $scope.showError("Check your connection!");
            });
        }
        if (type == 'edit-comment') {}
    };
    var comments = {};

    $scope.openSharePostForm = function () {
        $ionicModal.fromTemplateUrl('templates/modal/share_post.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalSharePost = modal;
            $scope.modalSharePost.show();
        });
    };

    $scope.facebookSharePost = function (id) {  

        var url = 'https://www.thebusinessclub.com/user-post/' + id;

        window.plugins.socialsharing.shareViaFacebook(null, null /* img */ , url, null, function (errormsg) {
            // window.open('https://www.facebook.com/sharer.php?s=100&&p[caption]=dasads&p[url]='.url, '_system');
        }, function (err) {
            $scope.showError("You have to install facebook");
        });
    };
    $scope.twitterSharePost = function (id, name, desc, img) {

        if(name != ''){
            name = name;
        }else{
            name = null;
        }

        if(desc != ''){
            desc = desc;
        }else{
            desc = null;
        }

        if(img != 'https://www.thebusinessclub.com/uploads/wall_posts/mob_img/'){
            img = img;
        }else{
            img = null;
        }

        var url = 'https://www.thebusinessclub.com/user-post/' + id;
        var share_url = 'https://twitter.com/share?url=' + url;
        window.plugins.socialsharing.shareViaTwitter(name, img /* img */ , url, desc, function (errormsg) {
            window.open(share_url, '_system');
        });
    };
    $scope.moreSocialSharePost = function (id, name, desc, img) {

        if(name != ''){
            name = name;
        }else{
            name = null;
        }

        if(desc != ''){
            desc = desc;
        }else{
            desc = null;
        }

        if(img != 'https://www.thebusinessclub.com/uploads/wall_posts/mob_img/'){
            img = img;
        }else{
            img = null;
        }

        var url = 'https://www.thebusinessclub.com/user-post/' + id;
        $ionicLoading.show();
        window.plugins.socialsharing.share(name, desc, img, url, function (success) {
            $ionicLoading.hide();
        }, function (error) {
            $ionicLoading.hide();
            $scope.showSuccess(error);
        });
    };
    $scope.whatsappSharePost = function (id, name, desc, img) {

        if(name != ''){
            name = name;
        }else{
            name = null;
        }

        if(desc != ''){
            desc = desc;
        }else{
            desc = null;
        }

        if(img != 'https://www.thebusinessclub.com/uploads/wall_posts/mob_img/'){
            img = img;
        }else{
            img = null;
        }

        var url = 'https://www.thebusinessclub.com/user-post/' + id;
        window.plugins.socialsharing.shareViaWhatsApp(name, img /* img */ , url, desc, function (errormsg) {
            $scope.showError("Cannot Share. Please try again later!");
        });
    };
    $scope.sendSMSPost = function (id, text) {

        var url = text + ' https://www.thebusinessclub.com/user-post/' + id;
        window.plugins.socialsharing.shareViaSMS(url);
    };

    $scope.closeSharePost = function () {

        $scope.modalSharePost.hide();
    };

    $scope.addSharePost = function (postDetails, post_id) {

        $ionicLoading.show({
            duration: 50000,
            template: '<ion-spinner icon="dots"></ion-spinner><br>Sharing'
        });
        if (!postDetails) {
            comments = "";
        } else {
            comments = postDetails.comments;

            exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            text1 = comments.replace(exp, " $1");
            exp2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
            comments = text1.replace(exp2, ' http://$2');
        }

        Data.send({
            api_key: api_key,
            txt_data: comments,
            post_id: post_id,
            tbl_share: 'No'
        }, 'addsharedwallpost').then(function (res) {

            Data.send({
                api_key: api_key,
                start: 0,
                count: 10
            }, 'userwallBeta1').then(function (res) {
                $rootScope.main_wall = JSON.parse(JSON.stringify(res)).wall_posts;
                $scope.image_location_post = res.image_location_post;
                $scope.image_location_user = res.image_location_user;
                $scope.user_image = res.user_image;
                if (res.wall_post_count > 10)
                    $scope.more = true;


                $timeout(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    $scope.closeSharePost();
                    $ionicLoading.hide();
                });


            }, function (x) {
                $scope.showError("Check your connection!");
            });



        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };



    $scope.uploadPicsWall = function (img_type, saveDetails) {
        var file_ids = [];
        angular.forEach($scope.postImages, function (value, key) {
            this.push(value['id']);
        }, file_ids);
        var api = api_key;
        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            $ionicLoading.show({
                template: '<ion-spinner icon="dots"></ion-spinner><br>Uploading'
            });

            console.log(images);

            images.forEach(function (i) {
                var options = new FileUploadOptions();
                options.fileKey = "uploadfile";
                options.fileName = i.substr(i.lastIndexOf('/') + 1);
                options.mimeType = "image/jpeg";
                var params = new Object();
                params.api_key = api_key;
                params.src = img_type;
                options.params = params;
                options.chunkedMode = false;

                $cordovaFileTransfer.upload(encodeURI(TBC.URL + 'imageUploadToServer'), i, options).then(function (r) {
                    var str = r.response;
                    var d = str.trim();
                    var obj = JSON.parse(d);
                    $scope.serverImage.push(obj);
                    incre++;
                    if (incre == images.length) {
                        angular.forEach($scope.serverImage, function (value, key) {
                            this.push(value['file_id']);
                        }, file_ids);
                        if (img_type == 'wall') {
                            Data.send({
                                api_key: api_key,
                                post_txt: saveDetails.comments,
                                post_id: saveDetails.post_id,
                                image_ids: file_ids
                            }, 'addEditWall').then(function (res) {
                                Data.send({
                                    api_key: api_key,
                                    start: 0,
                                    count: 10
                                }, 'userwallBeta1').then(function (res) {
                                    $rootScope.main_wall = JSON.parse(JSON.stringify(res)).wall_posts;
                                    $scope.image_location_post = res.image_location_post;
                                    $scope.image_location_user = res.image_location_user;
                                    $scope.user_image = res.user_image;
                                    if (res.wall_post_count >= 10)
                                        $scope.more = true;
                                    $scope.$broadcast('scroll.refreshComplete');
                                    $ionicLoading.hide();
                                }, function (x) {
                                    $ionicLoading.hide();
                                    $scope.showError("Check your connection!");
                                });
                                numImageSelect = 5;
                                images = [];
                                $scope.serverImage = [];
                                $scope.img = images;
                                incre = 0;
                                $timeout(function () {
                                    $scope.showSuccess('Successfully posted');
                                    $scope.closePost();
                                });
                            }, function (x) {
                                $ionicLoading.hide();
                                $scope.showError("Check your connection!");
                            });
                        }
                        if (img_type == 'groupwall') {}
                        if (img_type == 'group') {}
                        if (img_type == 'user_gallery') {}
                    }
                }, function (error) {

                    $scope.showError("Poor network connection. Check your connection!");

                    // alert("failM " + error);
                    // alert("An error has occurred: Code = " + error.code);
                    // alert("upload error source " + error.source);
                    // alert("upload error target " + error.target);
                }, options);
            });
        }
    };
    $scope.confirmDeletePost = function (id, index) {
        Data.send({
            api_key: api_key,
            post_id: id
        }, 'deleteWallPost').then(function (res) {
            if (res.success == 1) {
                $rootScope.main_wall.splice(index, 1);
            } else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };


    $scope.openSharePostForm = function () {
        $ionicModal.fromTemplateUrl('templates/modal/share_post.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalSharePost = modal;
            //console.log('messge');
            $scope.modalSharePost.show();
        });
    };

    $scope.closeSharePost = function () {

        $scope.modalSharePost.hide();
        $timeout(function () {
            $scope.modalSharePost.remove();
            angular.element(document.querySelector('.backdrop-modal')).remove();
            angular.element(document.querySelector('body')).removeClass('modal-open');


        }, 0);


    };

    $scope.openSharePost = function (post_id) {
        $scope.userDetails = $rootScope.appUserData;
        Data.send({
            api_key: api_key,
            wall_id: post_id
        }, 'singleWallbeta').then(function (res) {
            if (res.success == "1") {
                $scope.postDetails = {};
                $scope.postImages = res.wall_posts.image_list;
                $scope.postDetails = res.wall_posts;

                url = res.wall_posts.post_post;

                var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
                var result = url.replace(urlRegEx, "<a ng-click=\"directToPostLink('$1',\'_system\')\">$1</a>");

                $scope.name = result;

                $scope.image_location_post = res.image_location_post;
                $scope.postDetails.post_id = res.wall_posts.post_id;

                $scope.openSharePostForm();
                //console.log('show openSharePost');
            }
            //$scope.$broadcast('scroll.refreshComplete');
            $ionicLoading.hide();
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.confirmDeleteComment = function (id) {
        Data.send({
            api_key: api_key,
            reply_id: id
        }, 'deleteWallPostReply').then(function (res) {
            if (res.success == 1) {} else {}
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    }
    $scope.deletePost = function (type, id, index) {
        if (type == "edit-post" || type == "edit-post-home") {
            var confirmExitPost = $ionicPopup.confirm({
                title: 'Are you sure you want to delete this post ?',
                template: ''
            });
            confirmExitPost.then(function (res) {
                if (res) {
                    $scope.confirmDeletePost(id, index);
                    confirmExitPost.close();
                    $scope.closePopover();
                    $state.go('app.dash');
                } else {}
            });
        } else if (type == "edit-comment") {
            var confirmExitComment = $ionicPopup.confirm({
                title: 'Are you sure you want to delete this comment ?',
                template: ''
            });
            confirmExitComment.then(function (res) {
                if (res) {
                    $scope.closePopover();
                    $scope.confirmDeleteComment(id);
                } else {}
            });
            confirmExitComment.close();
        }
    }
    $scope.wallPostEditOption = function (type, id, index1) {
        var hideSheet = $ionicActionSheet.show({
            buttons: [{
                text: 'Edit'
            }, {
                text: '<span class="text-red"> Delete </span>'
            }],
            titleText: 'Post Option',
            cancelText: 'Cancel',
            cancel: function () {},
            buttonClicked: function (index) {
                if (index == 0) {
                    $scope.openPostApp(type, id, index1);
                } else if (index == 1) {
                    $scope.deletePost(type, id, index1);
                }
                return true;
            }
        });
    };
    $scope.readNotifications = function (type, id) {
        Data.send({
            api_key: api_key,
            type: type,
            id: id
        }, 'userNotificationUpdate').then(function (res) {}, function (x) {
            $scope.showError("Check your connection!");
        });
    };
    $scope.selectImageCam = function () {
        $scope.profileCameraOption(1, 'profile');
    };
    $scope.selectImages_tmp = function (num, img_type) {
        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            window.imagePicker.getPictures(function (results) {
                for (var i = 0; i < results.length; i++) {
                    numImageSelect--;
                    if (ionic.Platform.isAndroid()) {
                        $scope.img.push(results[i]);
                    }else{
                        $scope.img.push(window.Ionic.normalizeURL(results[i]));

                    }
                    $state.reload();
                }
            }, function (error) {
                $scope.showError("Poor network connection. Check your connection!");
            }, {
                maximumImagesCount: num,
                quality: 60
            });
        }

        //        function onDeviceReady() {
        //            var cameraOptions = {
        //                quality: 60,
        //                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
        //                destinationType: Camera.DestinationType.FILE_URI,
        //                allowEdit: true
        //            };
        //            navigator.camera.getPicture(function (success) {
        //                if (numImageSelect <= 5 && numImageSelect >= 1) {
        //                    images.push(success);
        //                    $scope.img.push(success);
        //                    numImageSelect--;
        //                    $state.reload();
        //                } else {}
        //            }, function (error) {
        //                $scope.showError('Check your Gallery option');
        //            }, cameraOptions);
        //        }
    };
    $scope.selectImagesCam = function (num, img_type) {
        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            var cameraOptions = {
                quality: 60,
                destinationType: Camera.DestinationType.FILE_URI,
                encodingType: Camera.EncodingType.JPEG,
                mediaType: Camera.MediaType.PICTURE,
                allowEdit: true
            };
            navigator.camera.getPicture(function (success) {
                if (numImageSelect <= 5 && numImageSelect >= 1) {
                    if (ionic.Platform.isAndroid()) {
                        $scope.img.push(success);
                    }else{
                        $scope.img.push(window.Ionic.normalizeURL(success));

                    }
                    numImageSelect--;
                    $state.reload();
                } else {}
            }, function (error) {
                // $scope.showError('Check your camera option');
            }, cameraOptions);
        }
    };
    $scope.selectVideosCam = function (num, img_type) {
        var options = {
            limit: 1,
            duration: 10,
            destinationType: Camera.DestinationType.FILE_URI,
            mediaType: Camera.MediaType.ALLMEDIA,
            allowEdit: true
        };
        navigator.device.capture.captureVideo(onSuccess, onError, options);

        function onSuccess(mediaFiles) {
            // var i, path, len;
            // for (i = 0, len = mediaFiles.length; i < len; i += 1) {
            //     path = mediaFiles[i].fullPath;
            //     //console.log(mediaFiles);
            // }

            if (numImageSelect <= 5 && numImageSelect >= 1) {
                images.push(mediaFiles[i].name);
                numImageSelect--;
                $state.reload();
                //console.log(mediaFiles);
            } else {}




        }

        function onError(error) {
            // navigator.notification.alert('Error code: ' + error.code, null, 'Capture Error');
        }
    };

    $scope.profileCameraOption = function (num_img, img_type) {
        TbcAuthService.getFileUploadPermission();
        if (img_type == "wall") {

            var hideSheet = $ionicActionSheet.show({
                buttons: [{
                    text: 'Load from Library'
                }, {
                    text: 'Image Camera'
                }],

                titleText: 'Select Image',
                cancelText: 'Cancel',
                cancel: function () {},
                buttonClicked: function (index) {

                    if (index == 0) {
                        $scope.selectImages_tmp(numImageSelect, img_type);
                    } else if (index == 1) {
                        $scope.selectImagesCam(numImageSelect, img_type);
                    }

                    return true;
                }
            });

        } else {
            var hideSheet = $ionicActionSheet.show({

                buttons: [{
                    text: 'Load from Library'
                }, {
                    text: 'Use Camera'
                }],

                titleText: 'Select Image',
                cancelText: 'Cancel',
                cancel: function () {},
                buttonClicked: function (index) {

                    if (index == 0) {
                        $scope.selectImages_tmp(numImageSelect, img_type);
                    } else if (index == 1) {
                        $scope.selectImagesCam(numImageSelect, img_type);
                    }

                    return true;
                }
            });
        }

    };
    $scope.likeWallPostReply = function (reply_id, like_status, post_id) {
        Data.send({
            api_key: api_key,
            reply_id: reply_id,
            like_status: like_status
        }, 'likeWallPostReply').then(function (res) {
            Data.send({
                api_key: api_key,
                wall_id: post_id
            }, 'singleWallbeta').then(function (res) {
                $scope.image_location_post = res.image_location_post;
                $scope.image_location_user = res.image_location_user;
                $rootScope.single_post = res.wall_posts;

                url = res.wall_posts.post_post;

                var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
                var result = url.replace(urlRegEx, "<a ng-click=\"directToPostLink('$1',\'_system\')\">$1</a>");

                $scope.name = result;

                $scope.$broadcast('scroll.refreshComplete');
            }, function (x) {
                $scope.showError("Check your connection!");
            });
        }, function (x) {
            $scope.showError("Check your connection!");
        });
    };
});
app.controller('PaymentCtrl', function ($scope, $timeout, $rootScope, $ionicLoading, Data, TBC) {
    /** 
     * Payment Controller templates/payment.html Configurations
     * ===============================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer    : Mohamed Rimsan - rimsnet@gmail.com
     * Controller   : PaymentCtrl
     * Main Method  : app.controller('PaymentCtrl',function(......){});
     * Reuse Method : -
     * Scope Method : 
     *                
     *                
     * Date         : 2017-04-20
     * ===============================================================
     * */
    $scope.card = {
        card_number: ''
    };
    $scope.invalid = '';
    $scope.checkPayment = function (card) {
        $ionicLoading.show();

        function card_chek_algo(anum) {
            anum = anum + '';
            var sum = 0,
                max = anum.length - 1;
            for (var j = max; j >= 0; j--) {
                var digit = parseInt(anum[j]);
                if ((max - j) & 1) {
                    var add = digit * 2;
                    sum += add < 10 ? add : 1 + add % 10;
                } else {
                    sum += digit;
                }
            }
            return sum % 10 === 0;
        }
        if (card) {
            var cardNumber = card.card_number,
                mm = card.mm,
                yy = card.yy,
                cardCVC = card.cvc;
            var mmyy = "" + mm + yy;
            if (mmyy.length != 4) {
                $scope.showError("Check your CVC");
            }
            if (card_chek_algo(cardNumber) && mmyy.length == 4) {
                Data.send({
                    api_key: api_key,
                    cardNumber: cardNumber,
                    mmyy: mmyy,
                    cardCVC: cardCVC
                }, 'confirm_account_info').then(function (res) {
                    if (res.success == 1) {
                        $ionicLoading.hide();
                        $scope.showSuccess(res.message, 4000);
                        $rootScope.activation_active = 1;
                        $timeout(function () {
                            location.reload();
                        }, 4000);
                    } else {
                        $rootScope.activation_active = 2;
                        $scope.showError(res.message);
                    }
                }, function (x) {
                    $scope.showError("Check your connection!");
                });
            } else {
                $scope.showError("Check your card number");
            }
        }
    };
});

app.controller('TodoCtrl', function ($scope, $timeout, $rootScope, $ionicLoading, Data, TBC) {
    
});

app.run(function ($interval, $rootScope, $stateParams, $ionicScrollDelegate, $timeout, Data, $ionicPickerI18n) {
    $ionicPickerI18n.weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    $ionicPickerI18n.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    $ionicPickerI18n.ok = "OK";
    $ionicPickerI18n.cancel = "Cancel";
    $ionicPickerI18n.okClass = "button-positive";
    $ionicPickerI18n.cancelClass = "button-stable";
    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    if ($stateParams.sid !== 'undefined' && $stateParams.fid !== 'undefined') {
        if ($stateParams.sid == 'undefined' && $stateParams.fid == 'undefined') {} else {
            var newChat = false;
            var backGroudLoop = $interval(function () {
                var api_key = window.localStorage.getItem('userkey');
                Data.send({
                    subject_id: $stateParams.sid,
                    sendby: $stateParams.fid,
                    api_key: api_key
                }, 'chatRecieve').then(function (res) {
                    if (res.success == 1) {
                        angular.forEach(res.messages, function (value, key) {
                            $rootScope.newMsg = {
                                id: value.id,
                                subject_id: value.subject_id,
                                contact_name: value.sen_name,
                                message_body: value.message_body,
                                sent_by: 0,
                                send_time: value.time_status,
                                date: new Date().getTime(),
                                userId: 1,
                                pic: '',
                                img_url: value.img_sen
                            };
                            $rootScope.chat_history.push($rootScope.newMsg);
                            // viewScroll.scrollBottom(true);
                            // $ionicScrollDelegate.scrollBottom();
                        });
                    } else {}

                    if(res.messages){
                        $rootScope.new_individual_msg = res.messages.length;

                    }else{
                        $rootScope.new_individual_msg = 0;
                    }


                    $rootScope.msg_count = res.unread_msg_count;
                    $rootScope.noti_count = res.noti_count;
                    $rootScope.friend_count = res.friend_count;
                }, function (x) {});
            }, 5000);
        }
    }
});


app.directive('expandingTextarea', function () {
    return {
        restrict: 'A',
        controller: function ($scope, $element, $attrs, $timeout) {
            $element.css('min-height', '0');
            $element.css('resize', 'none');
            $element.css('overflow-y', 'hidden');
            setHeight(0);
            $timeout(setHeightToScrollHeight);

            function setHeight(height) {
                $element.css('height', height + 'px');
                $element.css('max-height', height + 'px');
            }

            function setHeightToScrollHeight() {
                setHeight(0);
                var scrollHeight = angular.element($element)[0]
                    .scrollHeight;
                if (scrollHeight !== undefined) {
                    setHeight(scrollHeight);
                }
            }

            $scope.$watch(function () {
                return angular.element($element)[0].value;
            }, setHeightToScrollHeight);
        }
    };
});