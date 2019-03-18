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
      controller: ["$scope", "$rootScope", "$http", "$tm1", "$translate", "$timeout", "ngDialog", function ($scope, $rootScope, $http, $tm1, $translate, $timeout, ngDialog) {

         //=========
         // Variables
         $scope.defaults = {
            useHierarchy: true,
            useAttributes: true,
            startDayofWeek: 'Mon',
            fiscalYearStartMonth: 'Jul',
            allDimensionOptions: false,
            dimensionCreated: false,
            datePickerFormat: 'DD-MM-YYYY',
            datePickerView: 'day',
            defaultHierarchy: 'CalendarMonth',
            toDoLeafElements: 'deleteAllElements',
            dateRangeStart: moment().startOf('year'),
            dateRangeEnd: moment().endOf('year'),
            hierarchiesOrRollUps: 'Hierarchies',
            manageRollsUpsManually: false
         };
         $scope.selections = {
            dateRangeStart: $scope.defaults.dateRangeStart,
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
            dimensionCreated: $scope.defaults.dimensionCreated,
            datePickerFormat: $scope.defaults.datePickerFormat,
            datePickerView: $scope.defaults.datePickerView,
            defaultHierarchy: $scope.defaults.defaultHierarchy,
            toDoLeafElements: $scope.defaults.toDoLeafElements,
            hierarchiesOrRollUps: $scope.defaults.hierarchiesOrRollUps,
            manageRollsUpsManually: $scope.defaults.manageRollsUpsManually
         };

         //==========
         // Populate $scope.lists from settings-en.json file
         $scope.lists = [];
         $http.get("__/plugins/time-management/settings-en.json").then(function (value) {
            $scope.lists = value.data;
            $timeout(function () {
               var hierarchy = $scope.lists.hierarchyTypes[$scope.selections.dimensionType][[$scope.selections.defaultHierarchy]];
               $scope.addHierarchy(hierarchy.type);
               $scope.generateExample();
               $scope.generateDimensionInfo();
            });
         });

         //Define variables
         $scope.startDate = moment().startOf('year');
         //$scope.dateRangeStart = moment().startOf('year');
         //$scope.dateRangeEnd = moment().endOf('year');
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

         //================
         // Check if dimension already exists
         $scope.checkIfDimensionExist = function () {
            $scope.existingDimensions = [];
            //Get all dimensions
            $http.get(encodeURIComponent($scope.instance) + "/Dimensions?$select=Name").then(function (result) {
               for (var h = 0; h < result.data.value.length; h++) {
                  $scope.existingDimensions.push(result.data.value[h].Name);
               };
               if (_.includes($scope.existingDimensions, $scope.selections.dimensionName)) {
                  $scope.existingHierarchies = [];
                  $scope.existingHierarchiesName = [];
                  $scope.dimensionExists = true;
                  // If dimension exists check Hierarchies
                  $http.get(encodeURIComponent($scope.instance) + "/Dimensions('" + $scope.selections.dimensionName + "')/Hierarchies").then(function (result) {
                     //$scope.existingHierarchies = result.data.value;
                     for (var h = 0; h < result.data.value.length; h++) {
                        $scope.existingHierarchiesName.push(result.data.value[h].Name);
                        var existingHierarchyInfo = {
                           name: result.data.value[h].Name,
                           cardinality: result.data.value[h].Cardinality,
                           action: 'RECREATE'
                        };
                        //console.log(result.data.value[h]);
                        $scope.existingHierarchies.push(existingHierarchyInfo);
                     };
                  });
               } else {
                  $scope.dimensionExists = false;
               };
            });
         };

         //================
         // Check if dimension already exists
         $scope.lists.dimensions = [];
         $scope.getAllDimensionsName = function () {
            $http.get(encodeURIComponent($scope.instance) + "/Dimensions?$select=Name").then(function (result) {
               $scope.lists.dimensions = result.data.value;
            });
         };

         $scope.getAllDimensionsName();

         //================
         // Update position Week
         $scope.updateDayPosition = function (day) {
            console.log(day);
            var dayToUpdate = day;
            var consolidation = 'Week';
            var oldValue = "1";
            var newValue = "1";
            for (var i = 0; i < 7; i++) {
               if (i != 0) {
                  oldValue = newValue;
                  newValue = $scope.increaseConsolidationValue(consolidation, oldValue);
               }
               $scope.lists[dayToUpdate]['PositionInWeek'] = newValue;
               dayToUpdate = $scope.lists[dayToUpdate]['NextDay'];
            }
         }

         //=================
         // Update Month consolidation Quarter, HalfYear...
         $scope.updateMonthConso = function (consolidation, month, manual) {
            var monthToUpdate = month;
            var oldValue = $scope.lists[month][consolidation];
            var value1 = $scope.increaseConsolidationValue(consolidation, oldValue);
            var value2 = $scope.increaseConsolidationValue(consolidation, value1);
            var value3 = $scope.increaseConsolidationValue(consolidation, value2);
            var value4 = $scope.increaseConsolidationValue(consolidation, value3);
            if (manual) {
               $scope.lists[monthToUpdate][consolidation] = $scope.increaseConsolidationValue(consolidation, oldValue);
            } else {
               if (consolidation == 'Quarter' || consolidation == 'QuarterFY') {
                  for (var i = 0; i < 12; i++) {
                     if (i < 3) {
                        // keep value as the new first month value
                        $scope.lists[monthToUpdate][consolidation] = value1;
                     } else if (i < 6) {
                        // keep value as the new first month value
                        $scope.lists[monthToUpdate][consolidation] = value2;
                     } else if (i < 9) {
                        // keep value as the new first month value
                        $scope.lists[monthToUpdate][consolidation] = value3;
                     } else {
                        $scope.lists[monthToUpdate][consolidation] = value4;
                     }
                     monthToUpdate = $scope.lists[monthToUpdate]['NextMonth'];
                  }
               } else {
                  // If clicking Healf Year should update Half year and Quarters
                  //Update Half Year
                  for (var i = 0; i < 12; i++) {
                     if (i < 6) {
                        // keep value as the new first month value
                        $scope.lists[monthToUpdate][consolidation] = value1;
                     } else {
                        $scope.lists[monthToUpdate][consolidation] = value2;
                     }
                     monthToUpdate = $scope.lists[monthToUpdate]['NextMonth'];
                  }
                  //Update quarters
                  var quarterConso = 'Quarter';
                  var newQuarterValue = "0";
                  if (consolidation == 'HalfYearFY') {
                     quarterConso = 'QuarterFY';
                  }
                  if (value1 == "1") {
                     newQuarterValue = "4";
                  } else {
                     newQuarterValue = "2";
                  }
                  $scope.lists[monthToUpdate][quarterConso] = newQuarterValue;
                  $scope.updateMonthConso(quarterConso, month);
               }
               //does not exisit
               //$scope.updateMonthConsoAll(consolidation, month);
            }
         };

         $scope.increaseConsolidationValue = function (consolidation, currentValue) {
            // H flip next 5
            // Q flip next 3 increase by 1
            // increase by 1
            var newValue = "0"
            if (consolidation == 'Quarter' || consolidation == 'QuarterFY') {
               if (currentValue == "1") {
                  newValue = "2"
               } else if (currentValue == "2") {
                  newValue = "3"
               } else if (currentValue == "3") {
                  newValue = "4"
               } else {
                  newValue = "1"
               }
            } if (consolidation == 'HalfYear' || consolidation == 'HalfYearFY') {
               if (currentValue == "2") {
                  newValue = "1"
               } else {
                  newValue = "2"
               }
            } if (consolidation == 'Week') {
               if (currentValue == "1") {
                  newValue = "2"
               } else if (currentValue == "2") {
                  newValue = "3"
               } else if (currentValue == "3") {
                  newValue = "4"
               } else if (currentValue == "4") {
                  newValue = "5"
               } else if (currentValue == "5") {
                  newValue = "6"
               } else if (currentValue == "6") {
                  newValue = "7"
               } else {
                  newValue = "1"
               }
            }
            return newValue;
         };

         //==============
         // Date format for the datePicker
         $scope.updateDatePickerFormat = function () {
            if ($scope.selections.dimensionType == 'Day') {
               $scope.selections.datePickerFormat = 'DD-MM-YYYY';
               $scope.selections.datePickerView = 'day';
               $scope.selections.defaultHierarchy = 'CalendarMonth';
            } else if ($scope.selections.dimensionType == 'Month') {
               $scope.selections.datePickerFormat = 'MM-YYYY';
               $scope.selections.datePickerView = 'month';
               $scope.selections.defaultHierarchy = 'CalendarMonth';
            } else if ($scope.selections.dimensionType == 'Year') {
               $scope.selections.datePickerFormat = 'YYYY';
               $scope.selections.datePickerView = 'year';
               $scope.selections.defaultHierarchy = 'Calendar';
            };
            $scope.resetHierarchy();
            //console.log($scope.selections.datePickerFormat, $scope.selections.datePickerView);
         };

         //==============
         // Set active tab
         $scope.activeTab = 0;
         $scope.setActiveTab = function (tabIndex) {
            $scope.activeTab = tabIndex;
         };

         //===================
         // Manage hierarchies
         $scope.addHierarchy = function (hierarchyType) {
            var hierarchy = _.cloneDeep($scope.lists.hierarchyTypes[$scope.selections.dimensionType][hierarchyType]);
            $scope.hierarchies.push(hierarchy);
            $timeout(function () {
               $scope.generateDimensionInfo();
               //console.log($scope.hierarchies[0].levels[$scope.hierarchies[0].levels.length-1]);
               //console.log($scope.lists.dateFormats[$scope.selections.dimensionType].format);
            });
         };

         $scope.resetHierarchy = function () {
            $scope.hierarchies = [];
            var defaultHierarchy = $scope.lists.hierarchyTypes[$scope.selections.dimensionType][[$scope.selections.defaultHierarchy]];
            var hierarchy = _.cloneDeep($scope.lists.hierarchyTypes[$scope.selections.dimensionType][defaultHierarchy.type]);
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
         $scope.addAlias = function (index) {
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
                  Week: { format: 'YYYY[-W]1' },
                  Quater: { format: 'YYYY[-Q]1' },
                  HalfYear: { format: 'YYYY[-H]1' }
               }
            };
            $scope.aliases.push(newAlias);
            $timeout(function () {
               $scope.generateExampleAlias(index);
            });
         };

         $scope.aliases = [];
         $scope.addAlias(0);

         $scope.removeAlias = function (AliasIndex) {
            $scope.aliases.splice(AliasIndex, 1);
            $timeout(function () {
            });
         };

         //===================
         // Generate Examples for all possible conso
         $scope.generateExample = function () {
            // Get date
            var dateMoment = $scope.selections.dateRangeStart;
            // Define variables
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

         $scope.generateExampleAlias = function (alias) {
            console.log(alias);
            // Get date
            var dateMoment = $scope.startDate;
            // Define variables
            $scope.aliases[alias].examples = {
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

         $scope.generateAttributesExamples = function () {
            var firstDay = $scope.selections.dateRangeStart;
            var attributesList = $scope.lists.attributes[$scope.selections.dimensionType];
            for (var i = 0; i < attributesList.length; i++) {
               //var format = attributesList[i].format;
               //var id = attributesList[i].id;
               var attributeInfo = attributesList[i];
               $scope.lists.attributes[$scope.selections.dimensionType][i].example = $scope.generateAttributeValue(firstDay, attributeInfo);
            }
         };

         $scope.generateAttributeValue = function (day, attributeInfo) {
            var leafFormat = $scope.lists.dateFormats[$scope.selections.dimensionType].format;
            var yearFormat = $scope.lists.dateFormats['Year'].format;
            var monthFormat = $scope.lists.dateFormats['Month'].format;
            var format = attributeInfo.format;
            var func = attributeInfo.func;
            //console.log(leafFormat);
            var attributeValue = "";
            if (!_.isEmpty(format)) {
               attributeValue = day.format(format);
            }
            if (!_.isEmpty(func)) {
               // Function search for + or - in func
               var indexOperator = func.search("\\+");
               if (indexOperator == -1){
                  indexOperator = func.search("\\-");
               }
               var increment = func.substring(indexOperator,func.length)
               var type = func.substring(0,indexOperator)
               attributeValue = moment(day, "YYYY-MM-DD").add(increment, type).format(leafFormat);
            }
            return attributeValue;
         };

         $scope.generateAttributesValuesForOneElement = function (day, level) {
            var attributes = [];
            if (level == $scope.selections.dimensionType) {
               var attributesList = $scope.lists.attributes[$scope.selections.dimensionType];
               for (var i = 0; i < attributesList.length; i++) {
                  if (attributesList[i].included) {
                     var attribute = {
                        'name': attributesList[i].name,
                        'value': $scope.generateAttributeValue(day, attributesList[i]),
                        'type': attributesList[i].type
                     }
                     attributes.push(attribute);
                  }
               }
            }
            return attributes;
         }

         //===================
         // Generate Dimension information to show in the Review tab
         $scope.generateDimensionInfo = function () {
            $scope.checkIfDimensionExist();
            $scope.dimensionInfo = [];
            //Loop through all hierarchies
            _.each($scope.hierarchies, function (value, key) {
               var hierarchy = value;
               var hierarchyInfo = {
                  'display': true,
                  'type': hierarchy.type,
                  'name': hierarchy.name,
                  'topParent': hierarchy.topParent,
                  'elements': $scope.generateElements(hierarchy),
                  'uniqueElements': []
               };
               //hierarchyInfo.uniqueElements =  $scope.generateUniqueElements(hierarchy);
               $scope.dimensionInfo.push(hierarchyInfo);
            });
         };

         $scope.generateUniqueElements = function (hierarchy) {
            //Loop through all elements
            var startTimeMoment = $scope.selections.dateRangeStart;
            var endTimeMoment = $scope.selections.dateRangeEnd;
            var uniqueElements = [];
            /*for (var d = moment(startTimeMoment); d.diff(endTimeMoment, 'days') < 0; d.add(1, 'days')) {
               var startOfMonth = d.startOf('month').format('YYYY-MM-DD hh:mm');
               var level = 'Day';
               //console.log(d);
            };*/
            return uniqueElements;
         };

         $scope.generateElements = function (hierarchy) {
            //Loop through all elements
            var startTimeMoment = $scope.selections.dateRangeStart;
            var endTimeMoment = $scope.selections.dateRangeEnd;
            var elements = [];
            for (var m = moment(startTimeMoment); m.diff(endTimeMoment, 'days') < 0; m.add(1, 'days')) {
               var elementInfo = [];
               var levelNumber = 0;
               _.each(hierarchy.levels, function (element, key) {
                  // If Total
                  if (element.level == 'Total') {
                     elementInfo.push({
                        'level': element.level,
                        'name': hierarchy.levels[0].name
                     });
                     levelNumber = levelNumber + 1;
                     // If Fiscal Year
                  } else if (element.included) {
                     elementInfo.push({
                        'level': element.level,
                        'name': $scope.generateElement(m, element.level),
                        'attributes': $scope.generateAttributesValuesForOneElement(m, element.level)
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
            var monthMMM = day.format('MMM');
            var newDay = _.cloneDeep(day)
            var quarterFYNumber = $scope.lists[monthMMM].QuarterFY;
            if (level == 'YearFY' || level == 'HalfYearFY' || level == 'QuarterFY') {
               //Change year if Q3 or Q4
               if (quarterFYNumber == "3" || quarterFYNumber == "4") {
                  //console.log(day,newDay);
                  newDay = newDay.subtract(1, 'year');
               }
            }
            var year = newDay.format(formatYear);
            if (level == 'Day') {
               return newDay.format($scope.lists.dateFormats['Day'].format);
            } else if (level == 'Month') {
               if (formatMonth == 'Custom') {
                  var yearMonthSeparator = $scope.lists.separators['Month'].value;
                  var dateMonthNumber = newDay.format('M');
                  var month = year + yearMonthSeparator + dateMonthNumber;
               } else {
                  var month = newDay.format(formatMonth);
               }
               return month;
            } else if (level == 'Year') {
               return year;
            } else if (level == 'Quarter') {
               return newDay.format($scope.lists.dateFormats['Quarter'].format) + $scope.lists[monthMMM]['Quarter'];
            } else if (level == 'HalfYear') {
               return newDay.format($scope.lists.dateFormats['HalfYear'].format) + $scope.lists[monthMMM]['HalfYear'];
            } else if (level == 'Week') {
               return newDay.format($scope.lists.dateFormats['Week'].format) + newDay.week();
            } else if (level == 'FortNight') {
               return year + $scope.lists.separators['FortNight'].value + '1';
            } else if (level == 'YearFY') {
               return newDay.format($scope.lists.dateFormats['YearFY'].format);
            } else if (level == 'HalfYearFY') {
               return newDay.format($scope.lists.dateFormats['HalfYearFY'].format) + $scope.lists[monthMMM]['HalfYearFY'];
            } else if (level == 'QuarterFY') {
               return newDay.format($scope.lists.dateFormats['QuarterFY'].format) + $scope.lists[monthMMM]['QuarterFY'];
            } else if (level == 'MonthFY') {
               return $scope.lists.separators['MonthFY'].value + year;
            }
         };

         $scope.generateAlias = function (day, level) {
            var formatYear = $scope.lists.dateFormats['Year'].format;
            var formatMonth = $scope.lists.dateFormats['Month'].format;
            var year = day.format(formatYear);
            var monthNumber = day.format('MM');
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
               return day.format($scope.lists.dateFormats['Quarter'].format);
            } else if (level == 'HalfYear') {
               return day.format($scope.lists.dateFormats['HalfYear'].format);
            } else if (level == 'Week') {
               return day.format($scope.lists.dateFormats['Week'].format);
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
         $scope.executeGhostTI = function (prolog, epilog, step, hierarchy, continueToNextStep) {
            //console.log("Starting " + step);
            //console.log(prolog);
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
               //console.log(result);
               if (result.data == "") {
                  //No error
                  $scope.executeNextStep(step, hierarchy, continueToNextStep);
               } else {
                  //Error
                  var errorLogFile = result.data;
                  console.log("failed: " + errorLogFile);
               }
            });
         };

         $scope.resetSettings = function () {
            $scope.createDimensionDone = false;
            $scope.createHierarchy = false;
            $scope.elementsInserted = false;
            $scope.componentsAdded = false;
            $scope.attributesPopulated = false;
            $scope.attributesCreated = false;
         };

         $scope.executeNextStep = function (step, hierarchy, continueToNextStep) {
            if (continueToNextStep) {
               if(step === 'dimension') {
                  console.log('Dimension Created');
                  $scope.createDimensionDone = true;
                  // Next step
                  $scope.createHierarchies();
               }
               else if(step === 'hierarchy') {
                  console.log('Hierarchies created');
                  $scope.createHierarchy = true;
                  // Next step
                  $scope.insertElements(hierarchy);
               }
               else if(step == 'insertElements') {
                  console.log('Elements Inserted to ' + hierarchy.name);
                  $scope.elementsInserted = true;
                  // Next step
                  $scope.componentsAddToDimension(hierarchy);
               }
               else if (step == 'addComponents') {
                  console.log('Components Added');
                  $scope.componentsAdded = true;
                  // Next step -> attributes
                  $scope.createAttributes();
               } 
               else if (step == 'createAttributes' & !$scope.attributesCreated) {
                  console.log('Attributes Created');
                  $scope.attributesCreated = true;
                  // Next step -> attributes
                  $scope.populateAttributes();
               } else if (step == 'populateAttributes' & !$scope.attributesPopulated) {
                  console.log('Attributes Populated');
                  $scope.attributesPopulated = true;
                  // Next step -> attributes
                  console.log('All steps done!');
               };
            };
         };

         $scope.createDimension = function () {
            //dimension exist
            if ($scope.dimensionExists) {
               if ($scope.selections.toDoLeafElements == 'deleteAllElements') {
                  var prolog = "DimensionDeleteAllElements('" + $scope.selections.dimensionName + "');";
                  var epilog = "";
               }
               // dimension does not exist
            } else {
               var prolog = "DimensionCreate('" + $scope.selections.dimensionName + "');";
               var epilog = "";
            }
            $scope.executeGhostTI(prolog, epilog, 'dimension', "", true);
         };

         $scope.createHierarchies = function () {
            _.each($scope.dimensionInfo, function (hierarchy, key) {
               var prolog = "";
               var epilog = "";
               // WORKING WITH ROLLUPS
               if ($scope.selections.hierarchiesOrRollUps == 'RollUps') {
                  // Delete elements if or Unwind All
                  if ($scope.selections.toDoLeafElements == 'deleteAllElements') {

                  } else {
                     // Unwind only the hierarchy
                     prolog = "EXECUTEPROCESS('Bedrock.Dim.Hierarchy.Unwind.Consolidation','pDimension', '" + $scope.selections.dimensionName + "','pConsol', '" + hierarchy.topParent + "','pRecursive','1','pDebug', 0);";
                     epilog = "";
                  }
               } else {
                  // WORKING WITH HIERARCHIES
                  // check if Hierarchy exists
                  if (!_.includes($scope.existingHierarchiesName, hierarchy.name)) {
                     prolog = prolog + "HierarchyCreate('" + $scope.selections.dimensionName + "','" + hierarchy.name + "');";
                  }
                  epilog = "";
               }

               $scope.executeGhostTI(prolog, epilog, 'hierarchy', hierarchy, true);
               // insert Elements
            });
         };

         $scope.insertElements = function (hierarchy) {
            var prolog = '';
            var epilogue = '';
            var children = '';
            var consolidationsInserted = [];
            var linkAdded = [];
            var insertLines = [];
            _.each(hierarchy.elements, function (elementInfo, key) {
               elementInfo.reverse();
               // looping through elements
               _.each(elementInfo, function (element, key) {
                  //looping through
                  if (element.level == $scope.selections.dimensionType) {
                     //Leaf elements
                     children = element.name;
                     //prolog += "DimensionElementInsert('" + $scope.selections.dimensionName + "','','" + element.name + "','N');\n";
                     if ($scope.selections.hierarchiesOrRollUps == 'RollUps') {
                        insertLines.push("DimensionElementInsert('" + $scope.selections.dimensionName + "','','" + element.name + "','N');");
                     } else {
                        insertLines.push("HierarchyElementInsert('" + $scope.selections.dimensionName + "','" + hierarchy.name + "','','" + element.name + "','N');");
                     }
                  } else {
                     //Consolidation
                     var consolidation = element.name;
                     if (consolidationsInserted.indexOf(consolidation) === -1) {
                        // insert consolidation only if does not already exists
                        consolidationsInserted.push(consolidation);
                        //prolog += "DimensionElementInsert('" + $scope.selections.dimensionName + "','','" + consolidation + "','C');\n";
                        if ($scope.selections.hierarchiesOrRollUps == 'RollUps') {
                           insertLines.push("DimensionElementInsert('" + $scope.selections.dimensionName + "','','" + consolidation + "','C');");
                        } else {
                           insertLines.push("HierarchyElementInsert('" + $scope.selections.dimensionName + "','" + hierarchy.name + "','','" + consolidation + "','C');");
                        }
                     }
                  }
               });
            });
            //console.log(prolog);
            var lineCount = 0;
            //populate the Prolog
            for (var i = 0; i < insertLines.length; i++) {
               if (lineCount == 10000) {
                  $scope.executeGhostTI(prolog, epilogue, 'insertElements', hierarchy, false);
                  lineCount = 0;
                  prolog = "";
               } else {
                  prolog += insertLines[i] + "\n";
               }
               lineCount++;
            }
            if (!_.isEmpty(prolog)) {
               $scope.executeGhostTI(prolog, epilogue, 'insertElements', hierarchy, true);
            }
         };

         $scope.componentsAddToDimension = function (hierarchy) {
            var prolog = '';
            var epilogue = '';
            var children = '';
            var insertLines = [];
            var linkAdded = [];
            _.each(hierarchy.elements, function (elementInfo, key) {
               //elementInfo.reverse();
               _.each(elementInfo, function (element, key) {
                  if (element.level == $scope.selections.dimensionType) {
                     //Leaf elements
                     children = element.name;
                  } else {
                     //Consolidation
                     var consolidation = element.name;
                     var link = consolidation + children;
                     if (linkAdded.indexOf(link) == -1) {
                        // add consolidation only if does not already exists
                        //console.log(consolidation);
                        linkAdded.push(linkAdded);
                        //prolog += "DimensionElementComponentAdd('" + $scope.selections.dimensionName + "','" + consolidation + "','" + children + "',1);\n";
                        if ($scope.selections.hierarchiesOrRollUps == 'RollUps') {
                           insertLines.push("DimensionElementComponentAdd('" + $scope.selections.dimensionName + "','" + consolidation + "','" + children + "',1);");
                        } else {
                           insertLines.push("HierarchyElementComponentAdd('" + $scope.selections.dimensionName + "','" + hierarchy.name + "','" + consolidation + "','" + children + "',1);");
                        }
                        children = consolidation;
                     }
                  }
               });
            });
            //prologue = "DimensionElementComponentAdd('Period Dailya','2018-01','2018-01-01',1);";
            //console.log(prolog);
            var lineCount = 0;
            //populate the Prolog
            for (var i = 0; i < insertLines.length; i++) {
               if (lineCount == 10000) {
                  $scope.executeGhostTI(prolog, epilogue, 'addComponents', hierarchy, false);
                  lineCount = 0;
                  prolog = "";
               } else {
                  prolog += insertLines[i] + "\n";
               }
               lineCount++;
            }
            if (!_.isEmpty(prolog)) {
               $scope.executeGhostTI(prolog, epilogue, 'addComponents', hierarchy, true);
            }
         };

         $scope.createAttributes = function () {
            //dimension exist
            var prolog = "";
            var epilog = "";
            for (var a = 0; a < $scope.lists.attributes[$scope.selections.dimensionType].length; a++) {
               var attribute = $scope.lists.attributes[$scope.selections.dimensionType][a];
               if (attribute.included) {
                  prolog += "AttrInsert('" + $scope.selections.dimensionName + "','','" + attribute.name + "','" + attribute.type + "');";
               }
            };
            $scope.executeGhostTI(prolog, epilog, 'createAttributes', "", true);
         };

         $scope.populateAttributes = function () {
            var prolog = '';
            var epilogue = '';
            var insertLines = [];
            console.log("Inside populate Attributes");
            _.each($scope.dimensionInfo[0].elements, function (elementInfo, key) {
               //elementInfo.reverse();
               var leafElement = elementInfo[0];
               //Loop through attributes
               for (var a = 0; a < leafElement.attributes.length; a++) {
                  var attribute = leafElement.attributes[a];
                  //console.log(attribute);
                  if (attribute.type == 'S') {
                     //AttrPutS(Value,'DimName', 'ElName', 'AttrName')
                     insertLines.push("AttrPutS('" + attribute.value + "','" + $scope.selections.dimensionName + "','" + leafElement.name + "','" + attribute.name + "');");
                  } else {
                     //AttrPutN(Value,'DimName', 'ElName', 'AttrName')
                     insertLines.push("AttrPutN(" + attribute.value + ",'" + $scope.selections.dimensionName + "','" + leafElement.name + "','" + attribute.name + "');");
                  }
               };

            });
            //prologue = "DimensionElementComponentAdd('Period Dailya','2018-01','2018-01-01',1);";
            //console.log(prolog);
            var lineCount = 0;
            //populate the Prolog
            for (var i = 0; i < insertLines.length; i++) {
               if (lineCount == 10000) {
                  $scope.executeGhostTI(prolog, epilogue, 'populateAttributes', "", false);
                  lineCount = 0;
                  prolog = "";
               } else {
                  prolog += insertLines[i] + "\n";
               }
               lineCount++;
            }
            console.log(prolog);
            if (!_.isEmpty(prolog)) {
               $scope.executeGhostTI(prolog, epilogue, 'populateAttributes', "", true);
            }
         };

         $scope.tickAttributesByGroup = function (index) {
            var groupName = $scope.lists.attributesGroup[$scope.selections.dimensionType][index].name;
            var newStatus = !$scope.lists.attributesGroup[$scope.selections.dimensionType][index].included;
            $scope.lists.attributesGroup[$scope.selections.dimensionType][index].included = newStatus;
            for (var a = 0; a < $scope.lists.attributes[$scope.selections.dimensionType].length; a++) {
               if ($scope.lists.attributes[$scope.selections.dimensionType][a].group == groupName) {
                  $scope.lists.attributes[$scope.selections.dimensionType][a].included = newStatus;
                  //console.log($scope.lists.attributes[$scope.selections.dimensionType][a].group, $scope.lists.attributes[$scope.selections.dimensionType][a].included, included);
               }
            }
         };

         $scope.updateHierarchyAction = function (index) {
            var currentAction = $scope.existingHierarchies[index].action;
            var newAction = "NOTHING"
            if (currentAction == "DESTROY") {
               newAction = "RECREATE"
            } else if (currentAction == "RECREATE") {
               newAction = "DELETEALLELEMENTS"
            } else if (currentAction == "DELETEALLELEMENTS") {
               newAction = "UNWINDALLELEMENTS"
            } else if (currentAction == "NOTHING") {
               newAction = "DESTROY"
            }
            $scope.existingHierarchies[index].action = newAction;
         }


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

         $scope.openCreateModal = function () {
            var dialog = ngDialog.open({
               className: "ngdialog-theme-default medium",
               template: "__/plugins/time-management/modal.html",
               name: "Instances",
               scope: $scope,
               controller: ['$rootScope', '$scope', function ($rootScope, $scope) {

                  //$scope.selections.toDoLeafElements = $scope.ngDialogData.toDoLeafElements;
                  //$scope.selections.hierarchiesOrRollUps = $scope.ngDialogData.hierarchiesOrRollUps;

                  $scope.dimensionName = $scope.selections.dimensionName;
                  $scope.hierarchiesOrRollUps = $scope.selections.hierarchiesOrRollUps;
                  $scope.toDoLeafElements = $scope.selections.toDoLeafElements;

                  //======
                  // Function to create TM1 objects
                  $scope.create = function () {
                     $scope.resetSettings();
                     $scope.createDimension();
                  };

               }],
               data: {
                  dimensionName: $scope.dimensionName,
                  existingHierarchies: $scope.existingHierarchies,
                  hierarchiesOrRollUps: $scope.hierarchiesOrRollUps,
                  dimensionExists: $scope.dimensionExists,
                  toDoLeafElements: $scope.toDoLeafElements
               }
            });
         };

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