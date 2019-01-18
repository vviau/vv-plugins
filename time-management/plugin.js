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
            dimensionCreated: false,
            datePickerFormat: 'DD-MM-YYYY',
            datePicketView: 'day',
            defaultHierarchy: 'CalendarMonth',
            toDoLeafElements: 'deleteAllElements',
            dateRangeStart: moment().startOf('year'),
            dateRangeEnd: moment().endOf('year'),
            hierarchiesOrRollUps: 'RollUps',
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
            datePicketView: $scope.defaults.datePicketView,
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
            $http.get(encodeURIComponent($scope.instance) + "/Dimensions('" + $scope.selections.dimensionName + "')").then(function (value) {
               if (value.data.Name == $scope.selections.dimensionName) {
                  $scope.dimensionExists = true;
               } else {
                  $scope.dimensionExists = false;
               };
            });
         };

         $scope.checkIfDimensionExist();

         //================
         // Check if dimension already exists
         $scope.lists.dimensions = [];
         $scope.getAllDimensionsName = function () {
            $http.get(encodeURIComponent($scope.instance) + "/Dimensions?$select=Name").then(function (result) {
               $scope.lists.dimensions = result.data.value;
            });
         };

         $scope.getAllDimensionsName();

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
               console.log("UPDATED!");
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
                  for (var i = 0; i < 12; i++) {
                     if (i < 6) {
                        // keep value as the new first month value
                        $scope.lists[monthToUpdate][consolidation] = value1;
                     } else {
                        $scope.lists[monthToUpdate][consolidation] = value2;
                     }
                     monthToUpdate = $scope.lists[monthToUpdate]['NextMonth'];
                  }
               }
               //does not exisit
               //$scope.updateMonthConsoAll(consolidation, month);
            }
         };

         $scope.updateOneMonthValue = function (consolidation, month, newValue, action) {
            // H flip next 5
            // Q flip next 3 increase by 1
            //$scope.updateOneMonthValue(consolidation, monthToUpdate, newValue);

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
            }
            return newValue;
         };

         //==============
         // Date format for the datePicker
         $scope.updateDatePicketFormat = function () {
            if ($scope.selections.dimensionType == 'Day') {
               $scope.selections.datePickerFormat = 'DD-MM-YYYY';
               $scope.selections.datePicketView = 'day';
               $scope.selections.defaultHierarchy = 'CalendarMonth';
            } else if ($scope.selections.dimensionType == 'Month') {
               $scope.selections.datePickerFormat = 'MM-YYYY';
               $scope.selections.datePicketView = 'month';
               $scope.selections.defaultHierarchy = 'CalendarMonth';
            } else if ($scope.selections.dimensionType == 'Year') {
               $scope.selections.datePickerFormat = 'YYYY';
               $scope.selections.datePicketView = 'year';
               $scope.selections.defaultHierarchy = 'Calendar';
            };
            $scope.resetHierarchy();
            //console.log($scope.selections.datePickerFormat, $scope.selections.datePicketView);
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
               var format = attributesList[i].format;
               $scope.lists.attributes[$scope.selections.dimensionType][i].example = $scope.generateAttributeValue(firstDay, format);
            }
         };

         $scope.generateAttributeValue = function (day, format) {
            var attributeValue = "";
            if (!_.isEmpty(format)) {
               attributeValue = day.format(format);
            } else {
               attributeValue = "";
            }
            return attributeValue;
         };

         $scope.generateAttributesValuesForOneElement = function (day, level) {
            var attributes = [];
            if (level == $scope.selections.dimensionType) {
               var attributesList = $scope.lists.attributes[$scope.selections.dimensionType];
               for (var i = 0; i < attributesList.length; i++) {
                  if(attributesList[i].included){
                     var format = attributesList[i].format;
                     var attribute = {
                        'name':attributesList[i].name,
                        'value': $scope.generateAttributeValue(day, format)
                     }
                     attributes.push(attribute);
                  }
               }
            }
            return attributes;
         }

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
               return newDay.format($scope.lists.dateFormats['Week'].format);
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
         $scope.executeGhostTI = function (prolog, epilog, step, topParent, elements, continueToNextStep) {
            console.log(step);
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
                  $scope.executeNextStep(step, topParent, elements, continueToNextStep);
               } else {
                  //Error
                  var errorLogFile = result.data;
                  console.log("failed: " + errorLogFile);
               }
            });
         };

         $scope.executeNextStep = function (step, topParent, elements, continueToNextStep) {
            if (continueToNextStep) {
               if (step == 'dimension') {
                  $scope.createDimensionDone = true;
                  $scope.createHierarchies();
                  console.log('Dimension Created');
               }
               else if (step == 'insertElements') {
                  $scope.elementsInserted = true;
                  $scope.componentsAddToDimension(topParent, elements);
                  console.log('Elements Created');
               }
               else if (step == 'addComponents') {
                  $scope.componentsAdded = true;
                  console.log('Components Add');
               };
            };
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
            //dimension exist
            if ($scope.dimensionExists) {
               if ($scope.selections.toDoLeafElements == 'deleteAllElements') {
                  var prolog = "DimensionDeleteAllElements('" + $scope.selections.dimensionName + "');";
                  var epilog = "";
               } else {
                  var prolog = "EXECUTEPROCESS('Bedrock.Dim.Hierarchy.Unwind.All','pDimension', '" + $scope.selections.dimensionName + "','pDebug', 0);";
                  var epilog = "";
               }
               // dimension does not exist
            } else {
               var prolog = "DimensionCreate('" + $scope.selections.dimensionName + "');";
               var epilog = "";
            }
            $scope.executeGhostTI(prolog, epilog, 'dimension', "", "", true);
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
            var insertLines = [];
            _.each(elements, function (elementInfo, key) {
               elementInfo.reverse();
               // looping through elements
               _.each(elementInfo, function (element, key) {
                  //looping through
                  if (element.level == $scope.selections.dimensionType) {
                     //Leaf elements
                     children = element.name;
                     //prolog += "DimensionElementInsert('" + $scope.selections.dimensionName + "','','" + element.name + "','N');\n";
                     insertLines.push("DimensionElementInsert('" + $scope.selections.dimensionName + "','','" + element.name + "','N');");
                  } else {
                     //Consolidation
                     var consolidation = element.name;
                     if (consolidationsInserted.indexOf(consolidation) == -1) {
                        // insert consolidation only if does not already exists
                        consolidationsInserted.push(consolidation);
                        //prolog += "DimensionElementInsert('" + $scope.selections.dimensionName + "','','" + consolidation + "','C');\n";
                        insertLines.push("DimensionElementInsert('" + $scope.selections.dimensionName + "','','" + consolidation + "','C');");
                     }
                  }
               });
            });
            //console.log(prolog);
            var lineCount = 0;
            //populate the Prolog
            for (var i = 0; i < insertLines.length; i++) {
               if (lineCount == 10000) {
                  $scope.executeGhostTI(prolog, epilogue, 'insertElements', topParent, elements, false);
                  lineCount = 0;
                  prolog = "";
               } else {
                  prolog += insertLines[i] + "\n";
               }
               lineCount++;
            }
            if (!_.isEmpty(prolog)) {
               $scope.executeGhostTI(prolog, epilogue, 'insertElements', topParent, elements, true);
            }
         };

         $scope.componentsAddToDimension = function (topParent, elements) {
            var prolog = '';
            var epilogue = '';
            var children = '';
            var insertLines = [];
            var linkAdded = [];
            _.each(elements, function (elementInfo, key) {
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
                        insertLines.push("DimensionElementComponentAdd('" + $scope.selections.dimensionName + "','" + consolidation + "','" + children + "',1);");
                        children = consolidation;
                     }
                  }
               });
            });
            //prologue = "DimensionElementComponentAdd('Period Dailya','2018-01','2018-01-01',1);";
            console.log(prolog);
            var lineCount = 0;
            //populate the Prolog
            for (var i = 0; i < insertLines.length; i++) {
               if (lineCount == 10000) {
                  $scope.executeGhostTI(prolog, epilogue, 'addComponents', "", "", false);
                  lineCount = 0;
                  prolog = "";
               } else {
                  prolog += insertLines[i] + "\n";
               }
               lineCount++;
            }
            if (!_.isEmpty(prolog)) {
               $scope.executeGhostTI(prolog, epilogue, 'addComponents', "", "", true);
            }
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