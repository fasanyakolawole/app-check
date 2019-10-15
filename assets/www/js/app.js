angular.module('app', ['ionic', 'ngCordova', 'app.controllers', 'timer', 'ion-datetime-picker', 'app.services', 'angularMoment', 'topscroller', 'mdChips', 'ngSanitize'])

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
     *         - Don't use too many $scope variable 
     *           use javascript Var xx variables.
     *         - Each page should be Controllers & .html.
     *         - Minimize URL routings.
     *         - Don't change the Scrol functions.
     * */

    .constant('TBC', {
        version: '2.1.4',
        name: 'The Business Club',
        URL: 'https://api.thebusinessclub.com/api/v2/',
        // URL: 'http://localhost/ptb/web/ptb-web-api/api/v1/',
        WEB: 'https://www.thebusinessclub.com/',
        GCM_SenderID: '401937152742',
        OneSignalAppID: '09d231b5-7fcf-4d61-b040-dc249ca31ccb',
        payPalGetTokenURL: 'https://api.sandbox.paypal.com/v1/oauth2/token',
        payPalMakePaymentURL: 'https://api.sandbox.paypal.com/v1/payments/payment',
        payPalReturnURL: 'http://localhost/success',
        payPalCancelURL: 'http://localhost/cancel'
    })

    .constant('$ionicLoadingConfig', {
        duration: 80000,
        template: '<ion-spinner icon="dots"></ion-spinner><br>Loading...'
    })


    .run(function ($ionicPlatform, $state, $rootScope, $ionicPickerI18n, $interval, Data, TBC, $cordovaMedia, $timeout, $cordovaNativeAudio) {
        /** 
         * The Business Club (www.thebusinessclub.com)
         * ===================================================
         * PLUSPRO (OS) PVT LTD - Sri Lanka
         * Developer : Mohamed Rimsan - rimsnet@gmail.com
         * Method : run($ionicPlatform, $state, $rootScope,TBC)
         * Date  : 2017-03-06
         * ====================================================
         * */
        $ionicPlatform.ready(function () {
            
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {

                if (ionic.Platform.isIOS()) {

                } else {
                    StatusBar.styleDefault();
                }
            }

            $rootScope.loginStatus = false;

            var user = window.localStorage.getItem('userkey');

            if (user == null || user == '') {

                $rootScope.loginStatus = false;
                $state.go('app.welcome', {}, {
                    reload: true
                });



            } else {
                $rootScope.imgProfileUrl = null;
                $rootScope.loginStatus = true;
                $state.go('app.dash', {}, {
                    reload: true
                });
            }




            document.addEventListener('deviceready', function () {
                /** 
                 * Push Notification Configuration and Display
                 * ===================================================
                 * PLUSPRO (OS) PVT LTD - Sri Lanka
                 * Developer : Mohamed Rimsan - rimsnet@gmail.com
                 * Method : window.plugins.OneSignal();
                 * Date  : 2017-04-24
                 * ====================================================
                 * */
                var notificationOpenedCallback = function (jsonData) {

                };



                function getMediaURL(s) {
                    if (device.platform.toLowerCase() === "android")
                        return "/android_asset/www/" + s;
                    return s;
                }


                function playAudio(url) {


                    // Play the audio file at url
                    var my_media = new Media(url,
                        // success callback
                        function () {
                            //console.log("playAudio():Audio Success");
                        },
                        // error callback
                        function (err) {
                            console.log("playAudio():Audio Error: " + JSON.stringify(err));
                        });

                    // Play audio
                    my_media.play();
                    if (ionic.Platform.isAndroid()) {
                        my_media.setVolume(cordova.plugins.VolumeControl.getVolume());
                    }
                }
                window.plugins.OneSignal.enableSound(true);
                window.plugins.OneSignal

                    .startInit(TBC.OneSignalAppID)
                    .inFocusDisplaying(window.plugins.OneSignal.OSInFocusDisplayOption.None)
                    //.handleNotificationOpened(notificationOpenedCallback)
                    .handleNotificationReceived(function (jsonData) {


                        /** 
                         * Push Notification Configuration and Display
                         * ===================================================
                         * PLUSPRO (OS) PVT LTD - Sri Lanka
                         * Developer : Mohamed Rimsan - rimsnet@gmail.com
                         * Method : window.plugins.toast.showWithOptions({});
                         * Date  : 2017-04-24
                         * ====================================================
                         * */

                        if (ionic.Platform.isIOS()) {
                            //navigator.notification.beep(1);
                            playAudio("https://www.api.thebusinessclub.com/uploads/logo/beep.mp3");
                        }


                        if (ionic.Platform.isAndroid()) {
                            playAudio(cordova.file.applicationDirectory + 'www/' + "audio/beep.mp3");
                        }

                        window.plugins.toast.showWithOptions({
                            message: jsonData.payload.additionalData.message,
                            duration: "short",
                            position: "bottom"

                        });

                        if (jsonData.payload.additionalData.noti_type === "message") {

                            Data.send({
                                api_key: user,
                                start: 0,
                                count: 10
                            }, 'getChatList').then(function (resData) {

                                $rootScope.chatlist = resData.chat_list;

                            }, function (x) {
                                //$scope.showError("Check your connection!");
                            });
                        }

                    })
                    .handleNotificationOpened(function (jsonData) {
                        $timeout(function () {
                            var additionalData = jsonData.notification.payload.additionalData;
                            if (additionalData.noti_type == "message") {
                                $state.go('app.chat', {
                                    fid: additionalData.fid,
                                    sid: additionalData.sid,
                                    chatname: additionalData.chatname,
                                    chstat: additionalData.chstat,
                                    chread: additionalData.chread,
                                    sen: additionalData.sen
                                });

                            }

                            if (additionalData.noti_type == "post_like") {
                                $state.go('app.notification');
                            }

                            if (additionalData.noti_type == "post_comment") {
                                $state.go('app.notification');
                            }

                            if (additionalData.noti_type == "post_share") {
                                $state.go('app.notification');
                            }

                            if (additionalData.noti_type == "profile_view") {
                                $state.go('app.friends_profile', {
                                    "friendid": jsonData.notification.payload.additionalData.id
                                });
                            }

                            if (additionalData.noti_type == "enquiry") {
                                $state.go('app.viewMyOrderEnquiry', {
                                    orderId: additionalData.id
                                });

                            }
                            
                            if (additionalData.noti_type == "club_request") {
                                $state.go('app.view_clubs', {
                                    id: additionalData.id
                                });

                            }

                            if (additionalData.noti_type == "event_attendance") {
                                $state.go('app.view_club_event', {
                                    "id": jsonData.notification.payload.additionalData.id
                                });
                            }

                        });

                    })

                    .endInit();

            }, false);




        });
    })

    /** 
     * TBC App Page and URL Configurations
     * ===================================================
     * PLUSPRO (OS) PVT LTD - Sri Lanka
     * Developer : Mohamed Rimsan - rimsnet@gmail.com
     * Method : .config(function ($stateProvider, $httpProvider, $urlRouterProvider, $ionicConfigProvider){});
     * Date  : 2017-03-24
     * ====================================================
     * */

    .config(function ($stateProvider, $httpProvider, $urlRouterProvider, $ionicConfigProvider) {

        $ionicConfigProvider.navBar.alignTitle('center');

        $ionicConfigProvider.backButton.text('');
        $ionicConfigProvider.backButton.previousTitleText(false);

        $stateProvider.state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'templates/menu.html',
                controller: 'AppCtrl',
                resolve: {
                    "check": function ($rootScope, $state) {
                        var user = window.localStorage.getItem('userkey');
                        $rootScope.loginStatus = false;
                        if (user == null || user == '') {
                            $rootScope.loginStatus = false;


                            document.addEventListener("deviceready", onDeviceReadys, false);

                            function onDeviceReadys() {
                                if (navigator.splashscreen) {

                                    navigator.splashscreen.hide();
                                }
                            }

                        } else {
                            $rootScope.loginStatus = true;

                        }

                    }
                }
            })



            .state('app.welcome', {
                url: '/welcome',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/welcome/intro.html',
                        controller: 'AppCtrl'
                    }
                }
            })

            .state('app.dash', {
                url: '/dash',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/home.html',
                        controller: 'HomeCtrl'
                    }
                }
            })

            .state('app.mobtarrifs', {
                url: '/mobtarrifs',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/tarrifs/mobile_tarrifs.html',
                        controller: 'MobtarrifsCtrl'
                    }
                }
            })
            .state('app.myads', {
                url: '/myads',
                cache: true,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/my_ads.html',
                        controller: 'AdsProductCtrl'
                    }
                }
            })

            .state('app.myadsingle', {
                url: '/myads/:id',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/product-detail.html',
                        controller: 'AdsingleCtrl'
                    }
                }
            })

            .state('app.friends_profile', {
                url: '/friends_profile/:friendid',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/friends_profile.html',
                        controller: 'FriendCtrl'
                    }
                }
            })

            .state('app.allMyConnections', {
                url: '/allMyConnections/:friendid',
                cache: true,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/all_connections.html',
                        controller: 'AllConnectionCtrl'
                    }
                }
            })


            .state('app.myProfile', {
                url: '/myProfile',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/my_profile.html',
                        controller: 'MyProfileCtrl'
                    }
                }
            })
            .state('app.editProfileTest', {
                url: '/editProfileTest',
                cache: true,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/edit_profile_test.html',
                        controller: 'EditProfileCtrl'
                    }
                }
            })


            /** 
             * TBC App Logout Configurations
             * ===================================================
             * PLUSPRO (OS) PVT LTD - Sri Lanka
             * Developer : Mohamed Rimsan - rimsnet@gmail.com
             * Method : .state('logout')
             * Date  : 2017-03-24
             * ====================================================
             * */

            .state('logout', {
                url: '/logout',
                templateUrl: 'templates/intro.html',
                controller: 'AppCtrl',
                resolve: {
                    "check": function ($location, $rootScope, $ionicHistory, $state) {

                        $rootScope.loginStatus = false;

                        window.localStorage.removeItem('userkey');
                        $state.go('app.welcome', {}, {
                            reload: true
                        });

                        location.reload();

                    }
                }
            })

            .state('app.network', {
                url: '/network',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/network.html',
                        controller: 'NetworkCtrl'
                    }
                }
            })

            .state('app.about', {
                url: '/about',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/about.html'
                    }
                }
            })



            .state('app.product', {
                url: '/product/:category/:id',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/product.html',
                        controller: 'ProductCtrl'
                    }
                }
            })

            .state('app.editproduct', {
                url: '/editproduct/:id',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/editproduct.html',
                        controller: 'EditProductCtrl'
                    }
                }
            })

            .state('app.messaging', {
                url: '/messaging',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/messaging.html',
                        controller: 'MessageCtrl'
                    }
                }
            })
            .state('app.chat', {
                url: '/chat/:fid/:sid/:chatname/:chstat/:chread/:sen',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/chat.html',
                        controller: 'MessageChatCtrl'
                    }
                }
            })

            .state('app.post', {
                url: '/post/:postid/:navigate_from/:not_type/:readid',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/post.html',
                        controller: 'PostCtrl'
                    }
                }
            })

            .state('app.notification', {
                url: '/notification',
                cache: true,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/notification.html',
                        controller: 'NotificationCtrl'
                    }
                }
            })




            .state('app.localArea', {
                url: '/localArea',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/local_area.html',
                        controller: 'LocalAreaCtrl'
                    }
                }
            })

            .state('app.manageAds', {
                url: '/manageAds',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/manage_ads.html',
                        controller: 'ManageAdsCtrl'
                    }
                }
            })
            .state('app.enquiryAds', {
                url: '/enquiryAds',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/ads_enquiries.html',
                        controller: 'ManageAdsCtrl'
                    }
                }
            })
            .state('app.myOrders', {
                url: '/myOrders',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/ads_my_orders.html',
                        controller: 'ManageAdsCtrl'
                    }
                }
            })

            .state('app.viewMyOrderEnquiry', {
                url: '/viewMyOrderEnquiry/:orderId',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/view_my_order_enquiry.html',
                        controller: 'ManageSingleAdsCtrl'
                    }
                }
            })

            .state('app.appsettings', {
                url: '/appsettings',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/appsettings.html',
                        controller: 'SettingCtrl'
                    }
                }
            })

            .state('app.viewMemberEnquiry', {
                url: '/viewMemberEnquiry/:orderId/:navigate_from/:not_type/:readid',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/view_member_enquiry.html',
                        controller: 'ViewMemberEnquiryCtrl'
                    }
                }
            })

            .state('app.whoView', {
                url: '/whoView',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/who_view_myprofile.html',
                        controller: 'WhoViewCtrl'
                    }
                }
            })

            .state('app.events', {
                url: '/events',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/events.html',
                        controller: 'ClubEventsCtrl'
                    }
                }
            })

            .state('app.view_club_event', {
                url: '/view_club_event/:id/:navigate_from/:not_type/:readid',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/view_club_event.html',
                        controller: 'SingleEventCtrl'
                    }
                }
            })

            .state('app.clubs', {
                url: '/clubs',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/clubs.html',
                        controller: 'ClubCtrl'
                    }
                }
            })
    
            .state('app.view_clubs', {
                url: '/view_clubs/:id',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/view_clubs.html',
                        controller: 'ViewClubCtrl'
                    }
                }
            })

            .state('app.how_to', {
                url: '/how_to',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/how_to.html',
                        controller: 'TodoCtrl'
                    }
                }
            })


            .state('app.payment', {
                url: '/payment',
                cache: false,
                views: {
                    'menuContent': {
                        templateUrl: 'templates/payment.html',
                        controller: 'PaymentCtrl'
                    }
                }
            });


        $urlRouterProvider.otherwise('/app/welcome');
    });