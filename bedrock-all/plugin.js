
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
            $http.get(encodeURIComponent($scope.instance) + "/Processes?$select=Name&$filter=contains(Name,'edrock')").then(function (result) {
               $scope.lists.bedrockTIs = result.data.value;
               //console.log($scope.lists.bedrockTIs);
               for (var ti = 0; ti < $scope.lists.bedrockTIs.length; ti++) {
                  $scope.lists.bedrockTIinTM1.push($scope.lists.bedrockTIs[ti].Name);
               }
               // _each TODO
               $scope.checkRelationship();
            });
         };

         $scope.checkRelationship = function () {
            for (var ti = 0; ti < $scope.lists.bedrockTIs.length; ti++) {
               var tiSourceName = $scope.lists.bedrockTIs[ti].Name;
               //console.log(ti, tiSource.Name);
               $scope.lists.bedrockTIsInfo.push(getTiInfo(tiSourceName));
            }
            console.log($scope.lists.bedrockTIsInfo);
         };

         // function get
         var getTiInfo = function (processName) {
            var tiInfo = {
               name: processName
            };
            $http.get(encodeURIComponent($scope.instance) + "/Processes('" + processName + "')").then(function (result) {
               //console.log(processName);
               if (result.data.PrologProcedure) {
                  tiInfo.tisInProlog = $scope.searchTisIn(processName, result.data.PrologProcedure);
                  tiInfo.documentation = $scope.returnTisDocumentation(result.data.PrologProcedure);
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
            // Regular expression: "\\s*ExecuteProcess\\s*\\("
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

         $scope.returnTisDocumentation = function (text) {
            var documentation = {
               full:"",
               description:"",
               useCase:"",
               notes:"",
               missingDescription:false,
               useCaseIsLast:false
            }
            // Regular expression: "\\s*ExecuteProcess\\s*\\("
            var regionStart = '#Region @DOC';
            var indexStartRegion = text.search(regionStart);
            if (indexStartRegion == -1) {
               // Can't find start region
            } else {
               var subText = text.substring(indexStartRegion+12, text.length);
               var regionEnd = '#EndRegion @DOC';
               var indexEndRegion = subText.search(regionEnd);
               if (indexStartRegion == -1) {
                  // Can't find End of region
               } else {
                  documentation.full = subText.substring(1, indexEndRegion);
                  // search for description only
                  var indexDescription = documentation.full.search("Description:");
                  var indexUseCase = documentation.full.search("Use case:");
                  var indexNote = documentation.full.search("Note:");
                  if (indexDescription == -1) {
                     documentation.missingDescription = true
                     if(indexUseCase > indexNote){
                        documentation.title = subText.substring(3, indexNote-1);
                        documentation.useCase = subText.substring(indexUseCase+9, indexNote);
                        documentation.notes = subText.substring(indexNote+5, documentation.full.length);
                        documentation.useCaseIsLast = true;
                     } else {
                        documentation.title = subText.substring(3, indexUseCase-1);
                        documentation.useCase = subText.substring(indexUseCase+9, indexNote);
                        documentation.notes = subText.substring(indexNote+5, documentation.full.length);
                     }
                  } else {
                     if(indexUseCase > indexNote){
                        documentation.title = subText.substring(indexDescription+16, indexNote-1);
                        documentation.useCase = subText.substring(indexUseCase+9, indexNote);
                        documentation.notes = subText.substring(indexNote+5, documentation.full.length);
                        documentation.useCaseIsLast = true;
                     } else {
                        documentation.title = subText.substring(indexDescription+16, indexUseCase-1);
                        documentation.useCase = subText.substring(indexUseCase+9, indexNote);
                        documentation.notes = subText.substring(indexNote+5, documentation.full.length);
                     }
                  }
               }
            };
            return documentation
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