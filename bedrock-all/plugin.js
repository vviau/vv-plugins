
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
            allBedrockTIsInfo: [],
            bedrockTIsInfoFiltered: [],
            filterTisBy: []
         };
         $scope.values = {};

         $scope.showAttributes = true;

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
               var bedrockTiObject = getTiInfo(tiSourceName);
               $scope.lists.allBedrockTIsInfo.push(bedrockTiObject);
               $scope.lists.bedrockTIsInfoFiltered.push(bedrockTiObject);
            }
            //console.log($scope.lists.bedrockTIsInfo);
         };

         // function get
         var getTiInfo = function (processName) {
            var tiInfo = {
               name: processName
            };
            $http.get(encodeURIComponent($scope.instance) + "/Processes('" + processName + "')").then(function (result) {
               //console.log(result.data);
               if (result.data.Parameters) {
                  tiInfo.parameters = result.data.Parameters;
               }
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
            var previousText = "";
            var nextText = "";
            var processNameOrVariableName = "";
            var indexDelimiter = -1;
            var indexVariableName = -1;
            var variableName = "";
            var subText = "";
            var indexFirstVariableQuote = -1;
            var indexNextCommaDelimiter = 0;
            var indexNextBracketDelimiter = 0;
            // Regular expression: "\\s*ExecuteProcess\\s*\\("
            var searchExecuteProcess = 'ExecuteProcess';
            var indexExecuteProcessFound = text.search(searchExecuteProcess);
            var tiExists = false;
            if (indexExecuteProcessFound == -1) {
               return processesFound;
            } else {
               while (indexExecuteProcessFound > -1) {
                  variableName = "";
                  previousText = text;
                  // If ExecuteProcess found -> Search for next ","
                  nextText = text.substring(indexExecuteProcessFound + 15, text.length);
                  indexNextCommaDelimiter = nextText.search(",");
                  indexNextBracketDelimiter = nextText.search("\\\)");
                  // If next comma after bracket => bracket is the delimiter
                  if (indexNextCommaDelimiter > indexNextBracketDelimiter){
                     indexDelimiter = indexNextBracketDelimiter;
                  } else {
                     indexDelimiter = indexNextCommaDelimiter;
                  }
                  processNameOrVariableName = nextText.substring(1, indexDelimiter);
                  // Check if it is a processname -> search for "'"
                  if (processNameOrVariableName.search("'") > -1) {
                     //If processname -> remove ''
                     process = processNameOrVariableName.replace("'", "");
                     process = process.replace("'", "");
                     // remove " " as well
                     process = process.replace(" ", "");
                  } else {
                     // If variable name -> search for variable value in previousText
                     variableName = processNameOrVariableName.replace(" ", "");
                     variableName = variableName.replace(",", "");
                     if(variableName == "cThisProcName"){
                        process = processSource;
                     } else{
                           indexVariableName = previousText.search(variableName+" ");
                           if (indexVariableName == -1) {
                              indexVariableName = previousText.search(variableName+"=")
                           }
                           if (indexVariableName == -1) {
                              // Can't find variableName
                              //console.log("Can't find " + variableName);
                              process = "";
                           } else {
                              // VariableName found -> look for value
                              subText = previousText.substring(indexVariableName, indexExecuteProcessFound);
                              indexFirstVariableQuote = subText.search("'");
                              if (indexFirstVariableQuote == -1){
                                // console.log("Can't find quote in "+ subText);
                                 process ="";
                              } else {
                                 subTextMinusQuote = subText.substring(indexFirstVariableQuote+1, subText.length)
                                 indexSecondVariableQuote = subTextMinusQuote.search("'");
                                 process = subTextMinusQuote.substring(0, indexSecondVariableQuote);
                              }
                           }
                     }
                  }
                  if (process != "" & !_.includes(processesNameFound, process)) {
                     processesNameFound.push(process);
                     tiExists = _.includes($scope.lists.bedrockTIinTM1, process)
                     if(!tiExists){
                        tiExists = _.includes($scope.lists.bedrockTIinTM1, process.toLowerCase())
                     }
                     // Check if process exists
                     processInfo = {
                        name: process,
                        exists: tiExists
                     };
                     processesFound.push(processInfo);
                  }
                  // search Next ExecuteProcess
                  text = nextText;
                  indexExecuteProcessFound = text.search(searchExecuteProcess);
               }
               return processesFound;

            };
         };

         $scope.returnTisDocumentation = function (text) {
            var documentation = {
               full: "",
               description: "",
               useCase: "",
               notes: "",
               missingDescription: false,
               useCaseIsLast: false
            }
            // Regular expression: "\\s*ExecuteProcess\\s*\\("
            var regionStart = '#Region @DOC';
            var indexStartRegion = text.search(regionStart);
            if (indexStartRegion == -1) {
               // Can't find start region
            } else {
               var subText = text.substring(indexStartRegion + 12, text.length);
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
                     //IF NO DESCRIPTION:
                     documentation.missingDescription = true
                     if (indexUseCase > indexNote) {
                        documentation.description = subText.substring(3, indexNote - 1);
                        documentation.useCase = subText.substring(indexUseCase + 9, indexNote);
                        documentation.notes = subText.substring(indexNote + 5, documentation.full.length);
                        documentation.useCaseIsLast = true;
                     } else {
                        documentation.description = subText.substring(3, indexUseCase - 1);
                        documentation.useCase = subText.substring(indexUseCase + 9, indexNote);
                        documentation.notes = subText.substring(indexNote + 5, documentation.full.length);
                     }
                  } else {
                     //IF ONLY DESCRIPTION:
                     if (indexUseCase == -1 & indexNote ==-1) {
                        documentation.description = documentation.full.substring(indexDescription + 16, documentation.full.length);
                     } else if (indexUseCase == -1) {
                        documentation.description = subText.substring(indexDescription + 16, indexNote - 1);
                        documentation.notes = subText.substring(indexNote + 5, documentation.full.length);
                     }  else if (indexNote == -1) {
                        documentation.description = subText.substring(indexDescription + 16, indexUseCase - 1);
                        documentation.useCase = subText.substring(indexUseCase + 5, documentation.full.length);
                     }  else if (indexUseCase > indexNote) {
                        documentation.description = subText.substring(indexDescription + 16, indexNote - 1);
                        documentation.useCase = subText.substring(indexUseCase + 9, indexNote);
                        documentation.notes = subText.substring(indexNote + 5, documentation.full.length);
                        documentation.useCaseIsLast = true;
                     } else {
                        documentation.description = subText.substring(indexDescription + 16, indexUseCase - 1);
                        documentation.useCase = subText.substring(indexUseCase + 9, indexNote);
                        documentation.notes = subText.substring(indexNote + 5, documentation.full.length);
                     }
                  }
               }
            };
            return documentation
         };

         //Trigger Functions
         $scope.getBedrockList();

         $scope.addParameterToFilter = function (param) {
            if(!_.includes($scope.lists.filterTisBy, param)){
               $scope.lists.filterTisBy.push(param);
            }
            //$scope.filterTis = param;
            $scope.filterAllBedrockTIs();
         };

         $scope.filterAllBedrockTIs = function (){
            console.log($scope.lists.filterTisBy);
            $scope.lists.bedrockTIsInfoFiltered = [];
            // Loop through all TIs
            _.each($scope.lists.allBedrockTIsInfo, function (processInfo, key) {
               // Search through all filters
               var numberFiltersFound = 0;
               _.each($scope.lists.filterTisBy, function (paramFilter, key) {
                  // check if param is in filter
                  var parameterFound = _.find(processInfo.parameters, {Name:paramFilter});
                  if(!_.isEmpty(parameterFound)){
                     numberFiltersFound++;
                  }
               });
               // If all paramaters have been found add the TI
               if(numberFiltersFound == $scope.lists.filterTisBy.length){
                  $scope.lists.bedrockTIsInfoFiltered.push(processInfo);
               }
            });
         };

         $scope.removeOneFilter = function (param) {
            _.pull($scope.lists.filterTisBy, param);
            $scope.filterAllBedrockTIs();
         };

         $scope.clearFilter = function () {
            $scope.filterTis = "";
         };

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