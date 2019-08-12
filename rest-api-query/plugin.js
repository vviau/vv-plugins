
arc.run(['$rootScope', function ($rootScope) {

    $rootScope.plugin("tm1RestApiQuery", "RESTAPI", "page", {
        menu: "tools",
        icon: "fa-exchange",
        description: "This plugin can be used to search any TM1 objects",
        author: "Cubewise",
        url: "https://github.com/cubewise-code/arc-plugins",
        version: "1.0.0"
    });
}]);

arc.directive("tm1RestApiQuery", function () {
    return {
        restrict: "EA",
        replace: true,
        scope: {
            instance: "=tm1Instance"
        },
        templateUrl: "__/plugins/rest-api-query/template.html",
        link: function ($scope, element, attrs) {

        },
        controller: ["$scope", "$rootScope", "$http", "$tm1", "$translate", "$timeout", "$helper", function ($scope, $rootScope, $http, $tm1, $translate, $timeout, $helper) {

            // Create the tabs
            $scope.tabs = [];

            $scope.selections = {
                activeTab: 0,
                queryCounter: 0,
                method: 'GET',
                restApiQuery: 'Cubes',
                queryStatus: ''
            };

            $scope.clearRestHistory = function () {
               $rootScope.uiPrefs.restHistory = [];
            }
   
            if(!$rootScope.uiPrefs.restHistory || $rootScope.uiPrefs.restHistory.length === 0){
               $scope.clearRestHistory();
            }

            $scope.lists = {
                methods: ['GET', 'POST', 'PATCH', 'DELETE'],
                resultQuery: [],
                GET: [
                    { icon: 'cubes', name: 'Get list', restApiQuery: 'Cubes' },
                    { icon: 'cubes', name: 'Get list only names', restApiQuery: 'Cubes?$select=Name' },
                    { icon: 'cubes', name: 'Count All', restApiQuery: 'Cubes/$count' },
                    { icon: 'cubes', name: 'Get Dimensions', restApiQuery: "Cubes('cubeName')/Dimensions" },
                    { icon: 'cubes', name: 'Get only model cubes', restApiQuery: 'ModelCubes()' },
                    { icon: 'dimensions', name: 'Get list', restApiQuery: 'Dimensions' },
                    { icon: 'dimensions', name: 'Get one dimension', restApiQuery: "Dimensions('dimensionName')" },
                    { icon: 'dimensions', name: 'Get hierarchies', restApiQuery: "Dimensions('dimensionName')/Hierarchies" },
                    { icon: 'dimensions', name: 'Get list of attributes', restApiQuery: "Dimensions('dimensionName')/Hierarchies('dimensionName')/ElementAttributes" },
                    { icon: 'processes', name: 'Get list', restApiQuery: 'Processes' },
                    { icon: 'processes', name: 'Get only Model TI', restApiQuery: "Processes?$filter=substringof('}',Name) eq false&$select=Name" },
                    { icon: 'processes', name: 'Get hierarchies', restApiQuery: "Processes('processName')" },
                    { icon: 'fa-server', name: 'Metadata', restApiQuery: "$metadata" },
                    { icon: 'fa-server', name: 'Get Configuration', restApiQuery: "Configuration" },
                    { icon: 'fa-server', name: 'Get TM1 Version', restApiQuery: "Configuration/ProductVersion/$value" },
                    { icon: 'fa-server', name: 'Get Sessions', restApiQuery: "Threads?$expand=Session" }
                ],
                POST: [
                    { icon: 'cubes', name: 'Execute MDX', restApiQuery: 'ExecuteMDX?' },
                    { icon: 'cubes', name: 'Execute MDX with Cells', restApiQuery: 'ExecuteMDX?$expand=Cells' },
                    { icon: 'cubes', name: 'Execute MDX with Axes', restApiQuery: 'ExecuteMDX?$expand=Axes($expand=Hierarchies($select=Name;$expand=Dimension($select=Name)))' }
                ],
                PATCH: [
                    { icon: 'chores', name: 'Update Chore', restApiQuery: "Chores('choreName')" }
                ],
                DELETE: [
                    { icon: 'cubes', name: 'Delete a view', restApiQuery: "Cubes('cubeName')/Views('viewName')" },
                    { icon: 'dimensions', name: 'Delete a dimension', restApiQuery: "Dimensions('dimensionName')" },
                    { icon: 'subset', name: 'Delete a subset', restApiQuery: "Dimensions('dimensionName')/Hierarchies('hierarchyName')/Subsets('subsetName')"}
                ]
            }

            $scope.updateCurrentQuery = function(tab, item){
               console.log(tab,item);
               tab.restApiQuery = item.restApiQuery;
               tab.method = item.method;
               tab.body = item.body;
            }

            $scope.addTab = function () {
                // Add a tab
                $scope.selections.queryCounter++;
                $scope.tabs.push({
                    name: $translate.instant("QUERY") + " " + $scope.selections.queryCounter,
                    method: "GET",
                    restApiQuery: "Cubes",
                    body: '{"MDX":"SELECT \n'
                    + '\tNON EMPTY {[Version].[Actual], [Version].[Budget]} ON COLUMNS, \n'
                    + '\tNON EMPTY {TM1SUBSETALL([Account])} ON ROWS \n'
                    + 'FROM [General Ledger] \n'
                    + 'WHERE ([Department].[Corporate], [Year].[2012])"}',
                    hideBody: false,
                    message: null
                });
                $timeout(function () {
                    $scope.selections.activeTab = $scope.tabs.length - 1;
                });
            };
            // Add the initial tab
            $scope.addTab();

            $scope.closeTab = function (index) {
                // Remove a tab
                $scope.tabs.splice(index, 1);
            };

            $scope.tabSelected = function () {
                // This is required to resize the MDX panel after clicking on a tab
                //$scope.$broadcast("auto-height-resize");
            };

            //Execute Query
            $scope.executeQuery = function (query, body) {
                var tab = $scope.tabs[$scope.selections.activeTab];
                //var restAPIQuery = tab.restApiQuery;
                var restAPIQuery = "/" + query;
                var sendDate = (new Date()).getTime();
                var mdxClean = body.replace(/(\n|\t)/gm,"");
                var method = tab.method;
                $tm1.async($scope.instance, method, restAPIQuery, mdxClean).then(function (result) {
                   console.log(result)
                    if (result.status == 200 || result.status == 201 || result.status == 204) {
                        tab.queryStatus = 'success';
                        tab.resultQuery = result.data;
                        tab.message = null;
                    } else {
                        tab.queryStatus = 'failed';
                        tab.resultQuery = result.data.error;
                        tab.message = result.data.error.message;
                    }
                    var receiveDate = (new Date()).getTime();
                    tab.responseTimeMs = receiveDate - sendDate;
                    var newQuery = { restApiQuery: query, 
                                    method:method,
                                    body: mdxClean, 
                                    resultQuery: '', 
                                    queryStatus: tab.queryStatus, 
                                    message: tab.message,
                                    responseTimeMs: tab.responseTimeMs}
                  console.log(newQuery);
                    $rootScope.uiPrefs.restHistory.splice(0, 0, newQuery);
                    console.log($rootScope.uiPrefs.restHistory);
                });
            }

            $scope.indexTiFunctions = $rootScope.uiPrefs.restHistory.length - 1;

            $scope.key = function ($event, funcIndex, tab) {
               if($scope.indexTiFunctions == -1){
                  $scope.indexTiFunctions = 0;
               }
               var query = tab.restApiQuery;
               var body = tab.body;
               var currentQuery = $rootScope.uiPrefs.restHistory[$scope.indexTiFunctions]
               //Arrow up
               console.log($scope.indexTiFunctions, currentQuery)
               if ($event.keyCode == 38) {
                  $scope.updateCurrentQuery(tab, currentQuery);
                  $scope.updateindexTiFunctions("-1");
               }
               //Arrow down
               else if ($event.keyCode == 40) {
                  $scope.updateCurrentQuery(tab, currentQuery);
                  $scope.updateindexTiFunctions("+1");
               }
               //Enter
               else if ($event.keyCode == 13) {
                  $scope.executeQuery(query, body);
               }
            }

            $scope.updateindexTiFunctions = function (string) {
               if (string == "reset") {
                  $scope.indexTiFunctions = $rootScope.uiPrefs.restHistory.length - 1;
               } else if (string == "+1") {
                  var newindex = $scope.indexTiFunctions + 1;
                  if (newindex > $rootScope.uiPrefs.restHistory.length - 1) {
                     $scope.indexTiFunctions = 0;
                  } else {
                     $scope.indexTiFunctions = newindex;
                  }
               } else if (string == "-1") {
                  var newindex = $scope.indexTiFunctions - 1;
                  if (newindex < 0) {
                     $scope.indexTiFunctions = $rootScope.uiPrefs.restHistory.length - 1;
                  } else {
                     $scope.indexTiFunctions = newindex;
                  }
               }
            };
            
            $scope.$on("login-reload", function (event, args) {

            });

            $scope.$on("close-tab", function (event, args) {
                // Event to capture when a user has clicked close on the tab
                if (args.page == "tm1RestApiQuery" && args.instance == $scope.instance && args.name == null) {
                    // The page matches this one so close it
                    $rootScope.close(args.page, { instance: $scope.instance });
                }
            });

            $scope.$on("$destroy", function (event) {

            });


        }]
    };
});