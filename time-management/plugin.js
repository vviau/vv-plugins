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

        //$scope.myJSONFile = JSON.parse("__/plugins/time-management/settings-en.json");
        //console.log($scope.myJSONFile);

        $scope.lists = [];
        $http.get("__/plugins/time-management/settings-en.json").then(function (value) {
         $scope.lists = value.data;
         $timeout(function () {
            $scope.addHierarchy('CalendarMonth');
            $scope.generateExample();
            $scope.generateDimension();
         });
     });

         //Define variables
         $scope.startDate = moment().startOf('year');
         $scope.dateRangeStart = moment().startOf('year');
         $scope.dateRangeEnd = moment().endOf('year');
         $scope.startTimeIsOpen = false;
         $scope.endTimeIsOpen = false;

         $scope.defaults = {
            useHierarchy: true,
            useAttributes: true,
            startDayofWeek: 'Mon',
            fiscalYearStartMonth: 'Jul',
            allDimensionOptions: false
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
            allDimensionOptions: $scope.defaults.allDimensionOptions
         };
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
         $scope.setActiveTab = function (tabIndex){
            $scope.activeTab = tabIndex;
         };

         //===================
         // Manage hierarchies
         $scope.addHierarchy = function (hierarchyType) {
            //console.log($scope.lists.hierarchyTypes.Day.CalendarMonth);
            var dimensionType = $scope.selections.dimensionType;
            var hierarchy = _.cloneDeep($scope.lists.hierarchyTypes[dimensionType][hierarchyType]);
            $scope.hierarchies.push(hierarchy);
            $timeout(function () {
               //console.log($scope.hierarchies);
            });
         };

         $scope.hierarchies = [];

         $scope.removeHierarchy = function (hierarchyIndex) {
            $scope.hierarchies.splice(hierarchyIndex, 1);
            $timeout(function () {
               //console.log($scope.hierarchies);
            });
         };

         //===================
         // Manage Aliases
         $scope.addAlias = function () {
            var dimensionType = $scope.selections.dimensionType;
            if($scope.aliases.length==0){
               var aliasName = 'Description';
            }else{
               var aliasName = 'Description'+ $scope.aliases.length;
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
               //console.log($scope.aliases);
            });
         };

         $scope.aliases = [];
         $scope.addAlias();

         $scope.removeAlias = function (AliasIndex) {
            $scope.aliases.splice(AliasIndex, 1);
            $timeout(function () {
               //console.log($scope.aliases);
            });
         };

         //===================
         // Manage Dimension

         $scope.updateDimensionOptions = function () {
            $scope.selections.allDimensionOptions = !$scope.selections.allDimensionOptions;
            for (option in $scope.dimensionOptions) {
               $scope.dimensionOptions[option].value = $scope.selections.allDimensionOptions;
            }
         };

         $scope.updateDimensionOptions();

         /*$scope.attachAttributesToHierarchies = function () {
            _.each($scope.lists.hierarchies, function (value, key) {
               var hierarchies = value;
               var type = key;
               _.each(hierarchies, function (value, key) {
                  var rollUps = value.rollUps;
                  var hierarchy = key;
                  _.each(rollUps, function (value, key) {
                     var rollUp = value.name;
                     var attributes = $scope.lists.attributes[rollUp];
                     $scope.lists.hierarchies[type][hierarchy].rollUps[key].attributes.push(attributes);
                  });
               });
            });
         };*/

         // $scope.attachAttributesToHierarchies();

         $scope.getMonthFormat = function (dateMoment) {
            var formatYear = $scope.lists.dateFormats['Year'].format;
            var formatMonth = $scope.lists.dateFormats['Month'].format;
            var year = dateMoment.format(formatYear);
            if (formatMonth == 'Custom') {
               var yearMonthSeparator = $scope.lists.separators['Month'].value;
               var dateMonthNumber = dateMoment.format('M');
               var month = year + yearMonthSeparator + dateMonthNumber;
            } else {
               var month = dateMoment.format(formatMonth);
            }
            return month;
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
               Day: day,
               Month: $scope.getMonthFormat(dateMoment),
               Year: year,
               Quarter: year + $scope.lists.separators['Quarter'].value + '1',
               HalfYear: year + $scope.lists.separators['HalfYear'].value + '1',
               Week: year + $scope.lists.separators['Week'].value + '1',
               FortNight: year + $scope.lists.separators['FortNight'].value + '1',
               FiscalYear: $scope.lists.separators['FiscalYear'].value + year
            };
         };

         $scope.generateDimension = function () {
            $scope.lists.elements = [];
            var startTimeMoment = $scope.startDate;
            var endTimeMoment = $scope.dateRangeEnd;
            for (var m = moment(startTimeMoment); m.diff(endTimeMoment, 'days') <= 0; m.add(1, 'days')) {
               var day = m.format($scope.lists.dateFormats['Day'].format);
               var month = $scope.getMonthFormat(m);
               var year = m.format($scope.lists.dateFormats['Year'].format);
               var elementInfo = {
                  'leaf': day,
                  'Month': month,
                  'Year': year
               };
               $scope.lists.elements.push(elementInfo);
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