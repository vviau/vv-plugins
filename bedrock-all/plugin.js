
// Uncomment the code arc.run.. below to enable this plugin



arc.run(['$rootScope', function ($rootScope) {

   $rootScope.plugin("arcBedrockAll", "Bedrock All", "page", {
      menu: "tools",
      icon: "fa-recycle",
      description: "This plugin can be used to see the relationship between all Bedrock",
      author: "Cubewise",
      url: "https://github.com/cubewise-code/arc-plugins",
      version: "1.0.0"
   });

}]);


arc.directive("arcBedrockAll", function () {
   return {
      restrict: "EA",
      replace: true,
      scope: {
         instance: "=tm1Instance"
      },
      templateUrl: "__/plugins/bedrock-all/template.html",
      link: function ($scope, element, attrs) {

      },
      controller: ["$scope", "$rootScope", "$http", "$tm1", "$translate", "$timeout", function ($scope, $rootScope, $http, $tm1, $translate, $timeout) {

         //Define variables
         $scope.defaults = {};
         $scope.selections = {};
         $scope.lists = {
            bedrockTIinTM1: [],
            bedrockTIs: [],
            bedrockTIsInfo: []
         };
         $scope.values = {};

         //Functions
         $scope.getBedrockList = function () {
            $http.get(encodeURIComponent($scope.instance) + "/Processes?$select=Name&?$filter=substringof('rock',Name) eq true").then(function (result) {
               $scope.lists.bedrockTIs = result.data.value;
               //console.log($scope.lists.bedrockTIs);
               $scope.checkRelationship();
            });
         };

         $scope.checkRelationship = function () {
            for (var ti = 0; ti < $scope.lists.bedrockTIs.length; ti++) {
               var tiSourceName = $scope.lists.bedrockTIs[ti].Name;
               //console.log(ti, tiSource.Name);
               $scope.lists.bedrockTIinTM1.push(tiSourceName);
               $scope.lists.bedrockTIsInfo.push($scope.getTiInfo(tiSourceName));
            }
            // $scope.getTiInfo($scope.lists.bedrockTIs[0].Name);
            console.log($scope.lists.bedrockTIsInfo);
         };

         $scope.getTiInfo = function (processName) {
            var tiInfo = {
               name: processName
            };
            $http.get(encodeURIComponent($scope.instance) + "/Processes('" + processName + "')").then(function (result) {
               //console.log(processName);
               if (result.data.PrologProcedure) {
                  tiInfo.tisInProlog = $scope.searchTisIn(processName, result.data.PrologProcedure);
               } else {
                  tiInfo.tisInProlog = [];
               }
               if (result.data.MetaDataProcedure) {
                  tiInfo.tisInMetaData = $scope.searchTisIn(processName, result.data.MetaDataProcedure);
               } else {
                  tiInfo.tisInMetaData = [];
               }
               if (result.data.DataProcedure) {
                  tiInfo.tisInData = $scope.searchTisIn(processName, result.data.DataProcedure);
               } else {
                  tiInfo.tisInData = [];
               }
               if (result.data.EpilogProcedure) {
                  tiInfo.tisInEpilog = $scope.searchTisIn(processName, result.data.EpilogProcedure);
               } else {
                  tiInfo.tisInEpilog = [];
               }
            });
            return tiInfo;
         };

         $scope.searchTisIn = function (processSource, text) {
            var processesFound = [];
            var processesNameFound = [];
            var stringToSearch = 'edrock';
            var indexStringFound = text.search(stringToSearch);
            if (indexStringFound == -1) {
               return processesFound;
            } else {
               while (indexStringFound > -1) {
                  var nextText = text.substring(indexStringFound, text.length);
                  var indexNextSingleQuote = nextText.search("'");
                  var process = text.substring(indexStringFound - 1, indexStringFound + indexNextSingleQuote);
                  if (process.substring(0, 1) == 'b') {
                     process = "}" + process;
                  }
                  if (process.search("bedrocktm1.org") == -1
                     & process.search("v4") == -1
                     & process.search(".") > -1
                     & process.search("#") == -1
                     & process.search(":") == -1
                     & process.search(">") == -1) {
                     if (process !== processSource & !_.includes(processesNameFound, process)) {
                        processesNameFound.push(process);
                        // Check if process exists
                        processInfo = {
                           name: process,
                           exists: _.includes($scope.lists.bedrockTIinTM1, process)
                        };
                        processesFound.push(processInfo);
                     }
                  }
                  text = text.substring(indexStringFound + 20, text.length);
                  indexStringFound = text.search(stringToSearch);
               }
               return processesFound;

            };
         };

         //Trigger Functions
         $scope.getBedrockList();

         //Trigger an event after the login screen
         $scope.$on("login-reload", function (event, args) {

         });

         //Close the tab
         $scope.$on("close-tab", function (event, args) {
            // Event to capture when a user has clicked close on the tab
            if (args.page == "arcBedrockAll" && args.instance == $scope.instance && args.name == null) {
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