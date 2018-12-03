
arc.run(['$rootScope', function ($rootScope) {

    $rootScope.plugin("cubewiseSubset", "All Subsets", "page", {
        menu: "tools",
        icon: "subset",
        description: "This plugin can be used to search any TM1 objects",
        author: "Cubewise",
        url: "https://github.com/cubewise-code/arc-plugins",
        version: "1.0.0"
    });

}]);

arc.directive("cubewiseSubset", function () {
    return {
        restrict: "EA",
        replace: true,
        scope: {
            instance: "=tm1Instance"
        },
        templateUrl: "__/plugins/subset-all/template.html",
        link: function ($scope, element, attrs) {

        },
        controller: ["$scope", "$rootScope", "$http", "$tm1", "$translate", "$timeout", function ($scope, $rootScope, $http, $tm1, $translate, $timeout) {

            // Store the active tab index
            $scope.selections = {
                dimension: '',
                hierarchy: '',
                subset: ''
            };

            $scope.options = {
                seeSubsetsPerView: false,
                seeViewsPerSubset: false,
                seeAllSubsets: false,
                searchBySubset: true
            }

            $scope.lists = {
                dimensions: [],
                hierarchies: [],
                subsets: [],
                cubes: [],
                viewsAndSubsetsUnstructured: [],
                viewsAndSubsetsStructured: [],
                allSubsetsPerView: [],
                allViewsPerSubset: [],
                allSubsets: []
            }

            $scope.subsetsToDelete = [];

            $scope.toggleSubsetsToDelete = function (item) {
                if (_.includes($scope.subsetsToDelete, item)) {
                    _.remove($scope.subsetsToDelete, function (i) {
                        return i.name === item.name;
                    });
                } else {
                    $scope.subsetsToDelete.push(item);
                }
            };

            // GET DIMENSION DATA
            $scope.getAllSubsets = function () {
               $scope.lists.allSubsets=[];
                $http.get(encodeURIComponent($scope.instance) + "/ModelDimensions()").then(function (dimensionsData) {
                    $scope.lists.dimensions = dimensionsData.data.value;
                    //LOOP THROUGH DIMENSIONS
                    _.forEach($scope.lists.dimensions, function (value, key) {
                        var dimension = value.Name;
                        //console.log(dimension);
                        $http.get(encodeURIComponent($scope.instance) + "/Dimensions('" + dimension + "')/Hierarchies").then(function (hierarchiesData) {
                            $scope.lists.hierarchies = hierarchiesData.data.value;
                            //LOOP THROUGH HIERARCHIES FOR A DIMENSION
                            _.forEach($scope.lists.hierarchies, function (value, key) {
                                var hierarchy = value.Name;
                                //console.log(dimension, hierarchy);                                                                
                                $http.get(encodeURIComponent($scope.instance) + "/Dimensions('" + dimension + "')/Hierarchies('" + hierarchy + "')/Subsets").then(function (subsetsData) {
                                    $scope.lists.subsets = subsetsData;
                                    //LOOP THROUGH SUBSET FOR A HIERARCHY FOR A DIMENSION
                                    _.forEach($scope.lists.subsets, function (value, key) {
                                        var subsets = value.value;
                                        if (subsets) {
                                            _.forEach(subsets, function (value, key) {
                                                var subset = value.Name;
                                                $scope.lists.allSubsets.push({
                                                    name: subset,
                                                    uniqueName: value.UniqueName,
                                                    expression: value.Expression,
                                                    attributes: value.Attributes,
                                                    fqn: dimension + ':' + hierarchy + ':' + subset,
                                                    hierarchy: hierarchy,
                                                    dimension: dimension
                                                });
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            };
            $scope.getAllSubsets();

            //Manage color:
            $scope.generateHSLColour = function (string) {
                //HSL refers to hue, saturation, lightness
                var styleObject = {
                    "background-color": "",
                    "color": "white"
                };
                //for ngStyle format
                var hash = 0;
                var saturation = "50";
                var lightness = "50";

                for (var i = 0; i < string.length; i++) {
                    hash = string.charCodeAt(i) + ((hash << 5) - hash);
                }

                var h = hash % 360;
                styleObject["background-color"] = 'hsl(' + h + ', ' + saturation + '%, ' + lightness + '%)';

                return styleObject;
            };


            $scope.$on("login-reload", function (event, args) {

            });

            $scope.$on("close-tab", function (event, args) {
                // Event to capture when a user has clicked close on the tab
                if (args.page == "cubewiseSubset" && args.instance == $scope.instance && args.name == null) {
                    // The page matches this one so close it
                    $rootScope.close(args.page, { instance: $scope.instance });
                }
            });

            $scope.$on("$destroy", function (event) {

            });


        }]
    };
});