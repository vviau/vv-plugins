
arc.run(['$rootScope', function ($rootScope) {

    $rootScope.plugin("arcOpenSubsetEditor", "Open Subset Editor", "page", {
        menu: "tools",
        icon: "fa-paw",
        description: "This plugin can be used as a starting point for building new page plugins",
        author: "Cubewise",
        url: "https://github.com/cubewise-code/arc-plugins",
        version: "1.0.0"
    });

}]);

arc.directive("arcOpenSubsetEditor", function () {
    return {
        restrict: "EA",
        replace: true,
        scope: {
            instance: "=tm1Instance"
        },
        templateUrl: "__/plugins/open-subset-editor/template.html",
        link: function ($scope, element, attrs) {

        },
        controller: ["$scope", "$rootScope", "$http", "$tm1", "$translate", "$timeout", "$subsetDialogs",function ($scope, $rootScope, $http, $tm1, $translate, $timeout, $subsetDialogs) {

            //Define variables
            $scope.defaults = {};
            $scope.selections = {};
            $scope.lists = {};
            $scope.values = {};

            $scope.hierarchy = {
               name: "Account",
               dimension: "Account",
               subset:"Expense",
               expression:"",
               expressions:"",
               alias:"Account"
            }

            $scope.editSubset = function (hierarchy) {

               var handler = function(subset, elements){
             
                  // subset.selected has what element was clicked
                  $scope.elements = subset.selected;
                  
               };
               
               // Probably don't need the expression or expressions (not tested)
               var subset = {
                  name: hierarchy.subset,
                  expression: hierarchy.expression,
                  expressions: hierarchy.expressions,
                  alias: hierarchy.alias,
                  isSelector: true
               };

               $subsetDialogs.open($scope.instance, hierarchy.dimension, hierarchy.name, subset, handler);
               
             };
             

            //Trigger an event after the login screen
            $scope.$on("login-reload", function (event, args) {

            });

            //Close the tab
            $scope.$on("close-tab", function (event, args) {
                // Event to capture when a user has clicked close on the tab
                if (args.page == "arcOpenSubsetEditor" && args.instance == $scope.instance && args.name == null) {
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