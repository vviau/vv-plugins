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
      settingsJSON: "__/plugins/time-management/settings-en.json",
      link: function ($scope, element, attrs) {

      },
      controller: ["$scope", "$rootScope", "$http", "$tm1", "$translate", "$timeout", function ($scope, $rootScope, $http, $tm1, $translate, $timeout) {

         //=========
         // Variables
         $scope.defaults = {
            useHierarchy: true,
            useAttributes: true,
            startDayofWeek: 'Mon',
            fiscalYearStartMonth: 'Jul',
            allDimensionOptions: false,
            dimensionCreated: false
         };
         $scope.selections = {
            startDate: $scope.defaults.startDate,
            dateRangeEnd: $scope.defaults.dateRangeEnd,
            StartTimeMoment: moment($scope.defaults.startDate),
            format: 'YYYY-MM-DD',
            dimensionName: 'Period Daily',
            dimensionType: 'Day',
            useHierarchy: $scope.defaults.useHierarchy,
            useAttributes: $scope.defaults.useAttributes,
            startDayofWeek: $scope.defaults.startDayofWeek,
            fiscalYearStartMonth: $scope.defaults.fiscalYearStartMonth,
            allDimensionOptions: $scope.defaults.allDimensionOptions,
            dimensionCreated: $scope.defaults.dimensionCreated
         };

         //==========
         // Populate $scope.lists from settings-en.json file
         $scope.lists = [];
         $http.get("__/plugins/time-management/settings-en.json").then(function (value) {
            $scope.lists = value.data;
            $timeout(function () {
               $scope.addHierarchy('CalendarMonth');
               $scope.generateExample();
               $scope.generateDimensionInfo();
            });
         });

         //Define variables
         $scope.startDate = moment().startOf('year');
         $scope.dateRangeStart = moment().startOf('year');
         $scope.dateRangeEnd = moment().endOf('year');
         $scope.startTimeIsOpen = false;
         $scope.endTimeIsOpen = false;

         $scope.dimensionOptions = {
            Hierarchies: { name: 'Hierarchies', value: false },
            Aliases: { name: 'Aliases', value: false },
            Attributes: { name: 'Attributes', value: false },
            Cumulatives: { name: 'Cumulatives', value: false },
            Relatives: { name: 'Relatives', value: false }
         };

         $scope.values = {};

         //==============
         // Set active tab
         $scope.activeTab = 0;
         $scope.setActiveTab = function (tabIndex) {
            $scope.activeTab = tabIndex;
         };

         //===================
         // Manage hierarchies
         $scope.addHierarchy = function (hierarchyType) {
            var dimensionType = $scope.selections.dimensionType;
            var hierarchy = _.cloneDeep($scope.lists.hierarchyTypes[dimensionType][hierarchyType]);
            $scope.hierarchies.push(hierarchy);
            $timeout(function () {
               $scope.generateDimensionInfo();
            });
         };

         $scope.hierarchies = [];

         $scope.removeHierarchy = function (hierarchyIndex) {
            $scope.hierarchies.splice(hierarchyIndex, 1);
            $timeout(function () {
               $scope.generateDimensionInfo();
            });
         };

         //===================
         // Manage Aliases
         $scope.addAlias = function () {
            var dimensionType = $scope.selections.dimensionType;
            if ($scope.aliases.length == 0) {
               var aliasName = 'Description';
            } else {
               var aliasName = 'Description' + $scope.aliases.length;
            }
            var newAlias = {
               name: aliasName,
               format: {
                  Day: { format: 'DD-MM-YYYY' },
                  Month: { format: 'MM-YYYY' },
                  Year: { format: 'YYYY' },
                  Week: { format: 'Custom' },
                  Quater: { format: 'Custom' },
                  HalfYear: { format: 'Custom' }
               }
            };
            $scope.aliases.push(newAlias);
            $timeout(function () {
            });
         };

         $scope.aliases = [];
         $scope.addAlias();

         $scope.removeAlias = function (AliasIndex) {
            $scope.aliases.splice(AliasIndex, 1);
            $timeout(function () {
            });
         };

         $scope.generateExample = function () {
            // Get format
            var formatDay = $scope.lists.dateFormats['Day'].format;
            var formatYear = $scope.lists.dateFormats['Year'].format;
            // Get date
            var dateMoment = $scope.startDate;
            // Define variables
            var year = dateMoment.format(formatYear);
            var day = dateMoment.format(formatDay);
            $scope.examples = {
               Day: $scope.generateElement(dateMoment, 'Day'),
               Month: $scope.generateElement(dateMoment, 'Month'),
               Year: $scope.generateElement(dateMoment, 'Year'),
               Quarter: $scope.generateElement(dateMoment, 'Quarter'),
               HalfYear: $scope.generateElement(dateMoment, 'HalfYear'),
               Week: $scope.generateElement(dateMoment, 'Week'),
               FortNight: $scope.generateElement(dateMoment, 'FortNight'),
               YearFY: $scope.generateElement(dateMoment, 'YearFY'),
               HalfYearFY: $scope.generateElement(dateMoment, 'HalfYearFY'),
               QuarterFY: $scope.generateElement(dateMoment, 'QuarterFY'),
               MonthFY: $scope.generateElement(dateMoment, 'MonthFY')
            };
         };

         $scope.generateDimensionInfo = function () {
            $scope.dimensionInfo = [];
            //Loop through all hierarchies
            _.each($scope.hierarchies, function (value, key) {
               var hierarchy = value;
               var hierarchyInfo = {
                  'display': true,
                  'type': hierarchy.type,
                  'name': hierarchy.name,
                  'topParent': hierarchy.topParent,
                  'elements': $scope.generateElements(hierarchy)
               };
               $scope.dimensionInfo.push(hierarchyInfo);
            });
         };

         $scope.generateElements = function (hierarchy) {
            //Loop through all elements
            var startTimeMoment = $scope.startDate;
            var endTimeMoment = $scope.dateRangeEnd;
            var elements = [];
            for (var m = moment(startTimeMoment); m.diff(endTimeMoment, 'days') <= 0; m.add(1, 'days')) {
               var elementInfo = [];
               var levelNumber = 0;
               _.each(hierarchy.levels, function (element, key) {
                  if (element.included) {
                     elementInfo.push({
                        'level': element.level,
                        'name': $scope.generateElement(m, element.level)
                     });
                     levelNumber = levelNumber + 1;
                  };
               });
               elements.push(elementInfo);
            }
            return elements;
         };

         $scope.generateElement = function (day, level) {
            var formatYear = $scope.lists.dateFormats['Year'].format;
            var formatMonth = $scope.lists.dateFormats['Month'].format;
            var year = day.format(formatYear);
            if (level == 'Day') {
               return day.format($scope.lists.dateFormats['Day'].format);
            } else if (level == 'Month') {
               if (formatMonth == 'Custom') {
                  var yearMonthSeparator = $scope.lists.separators['Month'].value;
                  var dateMonthNumber = day.format('M');
                  var month = year + yearMonthSeparator + dateMonthNumber;
               } else {
                  var month = day.format(formatMonth);
               }
               return month;
            } else if (level == 'Year') {
               return year;
            } else if (level == 'Quarter') {
               return year + $scope.lists.separators['Quarter'].value + '1';
            } else if (level == 'HalfYear') {
               return year + $scope.lists.separators['HalfYear'].value + '1';
            } else if (level == 'Week') {
               return year + $scope.lists.separators['Week'].value + '1';
            } else if (level == 'FortNight') {
               return year + $scope.lists.separators['FortNight'].value + '1';
            } else if (level == 'YearFY') {
               return $scope.lists.separators['YearFY'].value + year;
            } else if (level == 'HalfYearFY') {
               return $scope.lists.separators['HalfYearFY'].value + year;
            } else if (level == 'QuarterFY') {
               return $scope.lists.separators['QuarterFY'].value + year;
            } else if (level == 'MonthFY') {
               return $scope.lists.separators['MonthFY'].value + year;
            }
         };

         //=======
         // Execute Ghost TI
         $scope.executeGhostTI = function (prolog, epilog, step, topParent, elements) {
            //	TM1 version < PAL 2.0.5: /ExecuteProcess
            //	TM1 version > PAL 2.0.5: /ExecuteProcessWithReturn?$expand=ErrorLogFile
            if ($scope.tm1VersionSupported) {
               var executeQuery = "/ExecuteProcessWithReturn?$expand=ErrorLogFile";
            } else {
               var executeQuery = "/ExecuteProcess";
            }
            body = {
               Process: {
                  Name: "TIConsole",
                  PrologProcedure: prolog,
                  EpilogProcedure: epilog
               }
            };
            var config = {
               method: "POST",
               url: encodeURIComponent($scope.instance) + executeQuery,
               data: body
            };
            $http(config).then(function (result) {
               //If ErrorLogFile does not exists => SUCCESS
               console.log(result);
               if (result.data == "") {
                  //No error
                  $scope.executeNextStep(step, topParent, elements);
               } else {
                  //Error
                  var errorLogFile = result.data;
                  console.log("failed: " + errorLogFile);
               }
            });
         };

         $scope.executeNextStep = function(step, topParent, elements){
            if(step == 'dimension' ){
               $scope.createDimensionDone = true;
               $scope.createHierarchies();
               console.log('Dimension Created');
            } 
            else if(step == 'insertElements'){
               $scope.elementsInserted = true;
               $scope.componentsAddToDimension(topParent, elements);
               console.log('Elements Created');
            } 
            else if(step == 'addComponents'){
               $scope.componentsAdded = true;
               console.log('Components Add');
            }
         };

         //======
         // Function to create TM1 objects
         $scope.create = function () {
            $scope.createDimensionDone = false;
            $scope.elementsInserted = false;
            $scope.componentsAdded = false;
            $scope.createDimension();
         };

         $scope.createDimension = function () {
            var prolog = "DimensionCreate('" + $scope.selections.dimensionName + "');";
            var epilog = "";
            $scope.executeGhostTI(prolog, epilog, 'dimension');
         };

         $scope.createHierarchies = function () {
            _.each($scope.dimensionInfo, function (hierarchy, key) {
               $scope.insertElementsToDimension(hierarchy.topParent, hierarchy.elements);
            });
         };

         $scope.insertElementsToDimension = function (topParent, elements) {
            var prolog = '';
            var epilogue = '';
            var children = '';
            var consolidationsInserted = [];
            var linkAdded = [];
            _.each(elements, function (elementInfo, key) {
               elementInfo.reverse();
               _.each(elementInfo, function (element, key) {
                  if(element.level == $scope.selections.dimensionType){
                     //Leaf elements
                     children = element.name;
                     prolog += "DimensionElementInsert('"+$scope.selections.dimensionName+"','','"+element.name+"','N');\n";
                  } else{
                     //Consolidation
                     var consolidation = element.name;
                     if(consolidationsInserted.indexOf(consolidation) == -1){
                        // insert consolidation only if does not already exists
                        consolidationsInserted.push(consolidation);
                        prolog += "DimensionElementInsert('"+$scope.selections.dimensionName+"','','"+consolidation+"','C');\n";
                     }
                  }
               });
            });
            //console.log(prolog);
            $scope.executeGhostTI(prolog, epilogue, 'insertElements', topParent, elements);
         };

         $scope.componentsAddToDimension = function (topParent, elements) {
            var prolog = '';
            var epilogue = '';
            var children = '';
            var consolidationsInserted = [];
            var linkAdded = [];
            _.each(elements, function (elementInfo, key) {
               //elementInfo.reverse();
               _.each(elementInfo, function (element, key) {
                  if(element.level == $scope.selections.dimensionType){
                     //Leaf elements
                     children = element.name;
                  } else{
                     //Consolidation
                     var consolidation = element.name;
                     var link = consolidation + children;
                     if(linkAdded.indexOf(link) == -1){
                        // add consolidation only if does not already exists
                        //console.log(consolidation);
                        linkAdded.push(linkAdded);
                        prolog += "DimensionElementComponentAdd('"+$scope.selections.dimensionName+"','"+consolidation+"','"+children+"',1);\n";
                        children = consolidation;
                     }
                  }
               });
            });
            //prologue = "DimensionElementComponentAdd('Period Dailya','2018-01','2018-01-01',1);";
            console.log(prolog);
            $scope.executeGhostTI(prolog, epilogue, 'addComponents');
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

         // START END DATE
         /* Bindable functions
 -----------------------------------------------*/
         $scope.endDateBeforeRender = endDateBeforeRender
         $scope.endDateOnSetTime = endDateOnSetTime
         $scope.startDateBeforeRender = startDateBeforeRender
         $scope.startDateOnSetTime = startDateOnSetTime

         function startDateOnSetTime() {
            $scope.$broadcast('start-date-changed');
         }

         function endDateOnSetTime() {
            $scope.$broadcast('end-date-changed');
         }

         function startDateBeforeRender($dates) {
            if ($scope.dateRangeEnd) {
               var activeDate = moment($scope.dateRangeEnd);

               $dates.filter(function (date) {
                  return date.localDateValue() >= activeDate.valueOf()
               }).forEach(function (date) {
                  date.selectable = false;
               })
            }
         }

         function endDateBeforeRender($view, $dates) {
            if ($scope.dateRangeStart) {
               var activeDate = moment($scope.dateRangeStart).subtract(1, $view).add(1, 'minute');

               $dates.filter(function (date) {
                  return date.localDateValue() <= activeDate.valueOf()
               }).forEach(function (date) {
                  date.selectable = false;
               })
            }
         }
         // END START END DATE


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