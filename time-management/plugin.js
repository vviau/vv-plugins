
// Uncomment the code arc.run.. below to enable this plugin



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
      link: function ($scope, element, attrs) {

      },
      controller: ["$scope", "$rootScope", "$http", "$tm1", "$translate", "$timeout", function ($scope, $rootScope, $http, $tm1, $translate, $timeout) {

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
         $scope.lists = {
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            separators: {
               Month: { type: 'Month', value: '-M' },
               Year: { type: 'Year', value: 'Y' },
               HalfYear: { type: 'HalfYear', value: '-H' },
               Quarter: { type: 'Quarter', value: '-Q' },
               Week: { type: 'Week', value: '-W' },
               FortNight: { type: 'FortNight', value: '-F' },
               FiscalYear: { type: 'FiscalYear', value: 'FY' }
            },
            elements: [],
            dimensionTypes: ['Day', 'Month', 'Year'],
            dimensionElements: {
               Day: ['Day', 'Month', 'Year', 'Week', 'FortNight', 'Quarter', 'HalfYear', 'FiscalYear'],
               Month: ['Month', 'Year', 'Quarter', 'HalfYear'],
               Year: ['Year']
            },
            dimensionElementTypes: {
               Day: { leaf: 'Day', rollUps: ['Month', 'Year'], groupConso: 'All Days' },
               Month: { leaf: 'Month', rollUps: ['Year'], groupConso: 'All Months' },
               Year: { leaf: 'Year', groupConso: 'All Years' }
            },
            dateFormats: {
               Day: { format: 'YYYY-MM-DD', formats: ['YYYY-MM-DD', 'YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'DD-MM-YY', 'DD/MM/YYYY', 'YY-MM-DD', 'YY/MM/DD', 'DD/MM/YY'] },
               Month: { format: 'YYYY-MM', formats: ['Custom', 'YYYY-MM', 'MM-YYYY', 'MM/YY', 'MM/YYYY', 'YYYY/MM', 'MM-YY', 'YY/MM', 'MM/YY'] },
               Year: { format: 'YYYY', formats: ['YYYY', 'YY'] },
               Quarter: { format: 'Custom', formats: ['Custom'] },
               HalfYear: { format: 'Custom', formats: ['Custom'] },
               Week: { format: 'Custom', formats: ['Custom'] },
               FiscalYear: { format: 'Custom', formats: ['Custom'] }
            },
            aliases: [
               { included: true, id: 'alias1', name: 'Short Desc' },
               { included: true, id: 'alias2', name: 'Long Desc' },
               { included: true, id: 'alias3', name: 'Description Desc' }
            ],
            aliasesFomat:
            {
               alias1: {
                  Day: { format: 'DD-MM-YYYY' },
                  Month: { format: 'MM-YYYY' },
                  Year: { format: 'YYYY' },
                  Week: { format: 'Custom' },
                  Quater: { format: 'Custom' },
                  HalfYear: { format: 'Custom' }
               },
               alias2: {
                  Day: { format: 'YYYY/MM/DD' },
                  Month: { format: 'YYYY/MM' },
                  Year: { format: 'YYYY' },
                  Week: { format: 'Custom' },
                  Quater: { format: 'Custom' },
                  HalfYear: { format: 'Custom' }
               },
               alias3: {
                  Day: { format: 'DD-MM-YY' },
                  Month: { format: 'MM-YY' },
                  Year: { format: 'YY' },
                  Week: { format: 'Custom' },
                  Quater: { format: 'Custom' },
                  HalfYear: { format: 'Custom' }
               }
            },
            attributes: {
               Day: [
                  { included: true, type: 'S', name: 'Year Short', format: 'YY' },
                  { included: true, type: 'S', name: 'Year Long', format: 'YYYY' },
                  { included: true, type: 'S', name: 'Month Short', format: 'MMM' },
                  { included: true, type: 'S', name: 'Month Long', format: 'MMMM' },
                  { included: true, type: 'S', name: 'Week Day Short', format: 'ddd' },
                  { included: true, type: 'S', name: 'Week Day Long', format: 'dddd' },
                  { included: true, type: 'N', name: 'Num Day', desc: 'Num Day' },
                  { included: true, type: 'N', name: 'Month Number', desc: 'Month Number' }
               ],
               Month: [
                  { included: true, type: 'S', name: 'Year Short', format: 'YY' },
                  { included: true, type: 'S', name: 'Year Long', format: 'YYYY' },
                  { included: true, type: 'S', name: 'Month Short', format: 'MMM' },
                  { included: true, type: 'S', name: 'Month Long', format: 'MMMM' },
                  { included: true, type: 'N', name: 'Month Number', desc: 'Month Number' }
               ]
            },
            cumuls: {
               Day: [
                  { included: true, id: 'YTG' },
                  { included: true, id: 'YTD' },
                  { included: true, id: 'CYTD' },
                  { included: true, id: 'MTG' },
                  { included: true, id: 'MTD' },
                  { included: true, id: 'DTG' },
                  { included: true, id: 'DTD' }
               ],
               Month: [
                  { included: true, id: 'YTG' },
                  { included: true, id: 'YTD' },
                  { included: true, id: 'CYTD' },
                  { included: true, id: 'MTG' },
                  { included: true, id: 'MTD' }
               ],
               Year: [
                  { included: true, id: 'YTG' },
                  { included: true, id: 'YTD' },
                  { included: true, id: 'CYTD' }
               ]
            },
            cumulsDesc: {
               YTG: { name: 'Year To Go', desc: 'SUM of Next Periods' },
               YTD: { name: 'Year To Date', desc: 'SUM of previous period from beginning of the year' },
               CYTD: { name: 'Cumul Year To Date', desc: 'SUM of all previsous period from beginning of time' },
               MTG: { name: 'Month To Go', desc: 'For example for 2016-12-25 MTG, SUM 2016-12-26 to 2016-12-31' },
               MTD: { name: 'Month To Date', desc: 'For example for 2016-12-25 MTD, SUM 2016-12-01 to 2016-12-25' },
               DTG: { name: 'Day To Go', desc: 'All days until the end of the year' },
               DTD: { name: 'Day To Date', desc: 'All previous days from beginning of the year' }
            },
            relatives: {
               Day: [
                  { included: true, id: 'CurrentYear' },
                  { included: true, id: 'PreviousYear' },
                  { included: true, id: 'CurrentMonth' },
                  { included: true, id: 'PreviousMonth' },
                  { included: true, id: 'Next12Months' },
                  { included: true, id: 'Last12Months' },
                  { included: true, id: 'Next6Months' },
                  { included: true, id: 'Last6Months' },
                  { included: true, id: 'CurrentDay' },
                  { included: true, id: 'PreviousDay' },
                  { included: true, id: 'CurrentWeek' },
                  { included: true, id: 'PreviousWeek' },
               ],
               Month: [
                  { included: true, id: 'CurrentYear' },
                  { included: true, id: 'PreviousYear' },
                  { included: true, id: 'CurrentMonth' },
                  { included: true, id: 'PreviousMonth' },
                  { included: true, id: 'Next12Months' },
                  { included: true, id: 'Last12Months' },
                  { included: true, id: 'Next6Months' },
                  { included: true, id: 'Last6Months' }
               ],
               Year: [
                  { included: true, id: 'CurrentYear' },
                  { included: true, id: 'PreviousYear' }
               ]
            },
            relativesDesc: {
               CurrentYear: { name: 'Current Year', desc: 'Current Year' },
               PreviousYear: { name: 'Previous Year', desc: 'Previous Year' },
               CurrentMonth: { name: 'Current Month', desc: 'Current Month' },
               PreviousMonth: { name: 'Previous Month', desc: 'Previous Month' },
               CurrentDay: { name: 'Current Day', desc: 'Current Day' },
               PreviousDay: { name: 'Previous Day', desc: 'Previous Day' },
               Next12Months: { name: 'Next 12 Months', desc: 'Next 12 Months' },
               Last12Months: { name: 'Last 12 Months', desc: 'Last 12 Months' },
               Next6Months: { name: 'Next 6 Months', desc: 'Next 12 Months' },
               Last6Months: { name: 'Last 6 Months', desc: 'Last 12 Months' },
               CurrentWeek: { name: 'Current Week', desc: 'Current Week' },
               PreviousWeek: { name: 'Previous Week', desc: 'Previous Week' }
            },
            hierarchyTypes: {
               Day: {
                  CalendarMonth: {
                     name: 'CalendarMonth', desc:'Calendar Month', topParent: 'All Years', levels: [
                        { level: 'Year', name: 'Year', included: true },
                        { level: 'HalfYear', name: 'HalfYear', included: true },
                        { level: 'Quarter', name: 'Quarter', included: true },
                        { level: 'Month', name: 'Month', included: true },
                        { level: 'Day', name: 'Day', included: true }
                     ]
                  },
                  CalendarWeek: {
                     name: 'CalendarWeek', desc:'Calendar Week', topParent: 'All Years', levels: [
                        { level: 'Year', name: 'Year', included: true },
                        { level: 'Week', name: 'Week', included: true },
                        { level: 'Day', name: 'Day', included: true }
                     ]
                  },
                  CalendarFY: {
                     name: 'CalendarFY', desc:'Calendar Fiscal Year', topParent: 'All Fiscal Years', levels: [
                        { level: 'YearFY', name: 'Year', included: true },
                        { level: 'HalfYearFY', name: 'HalfYear', included: true },
                        { level: 'QuarterFY', name: 'Quarter', included: true },
                        { level: 'MonthFY', name: 'Month', included: true },
                        { level: 'Day', name: 'Day', included: true }
                     ]
                  },
                  YTG: { name: 'YTG', desc: 'Year To Go - SUM of Next Periods', topParent: 'All Years YTG', levels: [
                     { level: 'YTG', name: 'YearTG', included: true },
                     { level: 'Year', name: 'Year', included: true },
                     { level: 'MonthFY', name: 'Month', included: true },
                     { level: 'Day', name: 'Day', included: true }
                  ] },
                  YTD: { name: 'YTD', desc: 'Year To Date - SUM of previous period from beginning of the year', topParent: 'All Years YTG', levels: [
                     { level: 'YTG', name: 'YearTG', included: true },
                     { level: 'Year', name: 'Year', included: true },
                     { level: 'MonthFY', name: 'Month', included: true },
                     { level: 'Day', name: 'Day', included: true }
                  ] },
                  CYTD: { name: 'CYTD', desc: 'Cumul Year To Date - SUM of all previsous period from beginning of time', topParent: 'All Years YTG', levels: [
                     { level: 'YTG', name: 'YearTG', included: true },
                     { level: 'Year', name: 'Year', included: true },
                     { level: 'MonthFY', name: 'Month', included: true },
                     { level: 'Day', name: 'Day', included: true }
                  ] },
                  MTG: { name: 'MTG', desc: 'Month To Go: For example for 2016-12-25 MTG, SUM 2016-12-26 to 2016-12-31', topParent: 'All Years YTG', levels: [
                     { level: 'YTG', name: 'YearTG', included: true },
                     { level: 'Year', name: 'Year', included: true },
                     { level: 'MonthFY', name: 'Month', included: true },
                     { level: 'Day', name: 'Day', included: true }
                  ] },
                  MTD: { name: 'MTD', desc: 'Month To Date: For example for 2016-12-25 MTD, SUM 2016-12-01 to 2016-12-25', topParent: 'All Years YTG', levels: [
                     { level: 'YTG', name: 'YearTG', included: true },
                     { level: 'Year', name: 'Year', included: true },
                     { level: 'MonthFY', name: 'Month', included: true },
                     { level: 'Day', name: 'Day', included: true }
                  ] },
                  DTG: { name: 'DTG', desc: 'Day To Go: All days until the end of the year', topParent: 'All Years YTG', levels: [
                     { level: 'YTG', name: 'YearTG', included: true },
                     { level: 'Year', name: 'Year', included: true },
                     { level: 'MonthFY', name: 'Month', included: true },
                     { level: 'Day', name: 'Day', included: true }
                  ] },
                  DTD: { name: 'DTD', desc: 'Day To Date: All previous days from beginning of the year', topParent: 'All Years YTG', levels: [
                     { level: 'YTG', name: 'YearTG', included: true },
                     { level: 'Year', name: 'Year', included: true },
                     { level: 'MonthFY', name: 'Month', included: true },
                     { level: 'Day', name: 'Day', included: true }
                  ] }
               },
               Month: {
                  Calendar: {
                     name: 'CalendarFY', levels: [
                        { level: '4', name: 'All Months', included: true },
                        { level: '3', name: 'Year', included: true },
                        { level: '2', name: 'HalfYear', included: true },
                        { level: '1', name: 'Quarter', included: true },
                        { level: '0', name: 'Month', included: true }
                     ]
                  },
                  CalendarFY: {
                     name: 'CalendarFY', levels: [
                        { level: '4', name: 'All Months', included: true },
                        { level: '3', name: 'FYYear', included: true },
                        { level: '2', name: 'FYHalfYear', included: true },
                        { level: '1', name: 'FYQuarter', included: true },
                        { level: '0', name: 'FYMonth', included: true }
                     ]
                  }
               }
            },
            attributeTypes: ['Alias', 'String', 'Numeric'],
         };
         $scope.values = {};

         //===================
         // Manage hierarchies
         $scope.addHierarchy = function (hierarchyType) {
            var dimensionType = $scope.selections.dimensionType;
            var hierarchy = $scope.lists.hierarchyTypes[dimensionType][hierarchyType];
            $scope.hierarchies.push(hierarchy);
            $timeout(function () {
               console.log($scope.hierarchies);
            });
         };

         $scope.hierarchies = [];
         $scope.addHierarchy('CalendarMonth');

         $scope.removeHierarchy = function (hierarchyIndex) {
            $scope.hierarchies.splice(hierarchyIndex, 1);
            $timeout(function () {
               console.log($scope.hierarchies);
            });
         };

         //===================
         // Manage Aliases
         $scope.addAlias = function () {
            var dimensionType = $scope.selections.dimensionType;
            var newAlias = {
               name: 'Description',
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
               console.log($scope.aliases);
            });
         };

         $scope.aliases = [];
         $scope.addAlias();

         $scope.removeAlias = function (AliasIndex) {
            $scope.aliases.splice(AliasIndex, 1);
            $timeout(function () {
               console.log($scope.aliases);
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

         $scope.generateExample();

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

         $scope.generateDimension();

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