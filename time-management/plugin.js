
// Uncomment the code arc.run.. below to enable this plugin



arc.run(['$rootScope', function ($rootScope) {

    $rootScope.plugin("arcTimeManagement", "Time Management", "page", {
        menu: "tools",
        icon: "fa-calendar",
        description: "This plugin can be used to manage Time dimensions",
        author: "Cubewise",
        url: "https://github.com/cubewise-code/arc-plugins",
        version: "1.0.0"
    });

}]);


arc.directive("arcTimeManagement", function () {
    return {
        restrict: "EA",
        replace: true,
        scope: {
            instance: "=tm1Instance"
        },
        templateUrl: "__/plugins/time-management/template.html",
        link: function ($scope, element, attrs) {

        },
        controller: ["$scope", "$rootScope", "$http", "$tm1", "$translate", "$timeout", function ($scope, $rootScope, $http, $tm1, $translate, $timeout) {

            //Define variables
            $scope.defaults = {
               StartTime : new Date(),
               datepickerOptions: {enableTime: false}
            };
            $scope.selections = {
               StartTime : $scope.defaults.StartTime,
               format:'yyyy-MM-dd'
            };
            $scope.time = {
               StartTime : new Date(),
               EndTime : new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            };
            $scope.lists = {
               dateFormats:['yyyy-MM-dd','yyyy/MM/dd','dd-MM-yyyy','dd/MM/yyyy',
               'yy-MM-dd','yy/MM/dd','dd/MM/yy',
               'short','medium','fullDate','longDate','mediumDate','shortDate']
            };
            $scope.values = {};


            //Trigger an event after the login screen
            $scope.$on("login-reload", function (event, args) {

            });

            //Close the tab
            $scope.$on("close-tab", function (event, args) {
                // Event to capture when a user has clicked close on the tab
                if (args.page == "arcTimeManagement" && args.instance == $scope.instance && args.name == null) {
                    // The page matches this one so close it
                    $rootScope.close(args.page, { instance: $scope.instance });
                }
            });

            //Trigger an event after the plugin closes
            $scope.$on("$destroy", function (event) {

            });


        }]
    };
});