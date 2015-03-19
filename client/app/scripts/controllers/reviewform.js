'use strict';

/**
 * @ngdoc function
 * @name ratemycoopApp.controller:ReviewformCtrl
 * @description
 * # ReviewformCtrl
 * Controller of the ratemycoopApp
 */
angular.module('ratemycoopApp')
  .controller('ReviewformCtrl', function ($scope, Company, Major, City, Perk, PayType, User, $routeParams, $location) {
    // Setting visual component models for loading
    $scope.loading = {
      main: true, // Promise, must be turned to false somewhere
      perks: true // Promise, must be turned to false somewhere
    };


    /************************************************************************************
     * SETUP AND INITIALIZATION
     ************************************************************************************/
    /**
     * Check if user is authenticated
     */
    if (User.isAuthenticated()) {
      $scope.user = User.getCurrent(
        function (success) {
          $scope.formData.userId = success.id;
        }
      );
    } else {
      console.log('ERROR: User must be authenticated');
      $location.path('/login');
      $scope.user = null;
    }

    /**
     * Get company info on-load
     */
    $scope.company = Company.findOne({
        filter: {
          where: {name: $routeParams.companyname},
          include: ['perks', 'majors', 'reviews', {'locations': 'region'}]
        }
      },
      function (successData) {
        $scope.loading.main = false;
      }
    );

    /**
     * Used if we want to fetch for pay types, as opposed to using just
     * $scope.payTypes. This is represented as the menus in the paytype dropdown.
     */
    $scope.fetchedPayTypes = PayType.find({},
      function (success) {
      });
    $scope.payTypes = [{id: 1, name: "Hourly"}, {id: 2, name: "Salary (Monthly)"}, {id: 3, name: "Stipend"}];


    /**
     * Get major info on-load
     * and set search for it
     */
    $scope.majors = Major.find({},
      function (successData) {
        angular.forEach(successData, function (result) {
          result.title = result.name;
          result.description = result.code;
        });

        // This calls on the Semantic search api for activating search.
        $('#majorSearch').search({
          source: $scope.majors,
          maxResults: 4,
          searchFields: ['code', 'name']
        })
      }
    );

    /**
     * Get perks on load
     * and set client model fo rit
     */
    $scope.allPerks = Perk.find({},
      function (successData) {
        angular.forEach(successData, function (value) {
          value['isSelected'] = false;
        });
        $scope.loading.perks = false;
        // Success allperks
      }
    );


    /************************************************************************************
     * PERKS TOGGLE FUNCTIONALITY
     ************************************************************************************/
    $scope.togglePerkAddition = function (perk) {
      if (!perk.isSelected) {
        perk.isSelected = true; //This toggles ui change
        $scope.formData.perks.push(perk.id); // This adds only id, to formData.perks
      } else {
        perk.isSelected = false; // this toggles ui change
        var i = $scope.formData.perks.indexOf(perk.id); // this finds and removes perk id from perks
        if (i > -1) {
          $scope.formData.perks.splice(i, 1);
        }
      }
    };

    /************************************************************************************
     * FORM MODEL AND SUBMISSION FUNCTIONS
     ************************************************************************************/
      // Initial model declaration for form
    $scope.formData = {
      error: false,
      errorMessage: "Something went wrong, try submitting again",

      overallRating: 0,
      cultureRating: 0,
      difficultyRating: 0,

      description: "",

      pay: "",
      payTypeId: $scope.payTypes[0].id,
      jobTitle: "",

      //userId: explicitly set after callback, see @User

      perks: [],

      returnOffer: false,
      recommend: false,
      anonymous: true
    };

    /**
     * ACTION: parse the form model and submit/push to backend
     */
    $scope.submitReview = function () {
      $scope.loading.main = true;
      $scope.loading.perks = true;
      var pushObject = prepForPush($scope.formData);

      Company.reviews.create(
        {id: $scope.company.id},
        pushObject,
        function (success) {
          $scope.loading.main = false;
          $scope.loading.perks = false;
          $scope.formData.error = false;
          $location.path('/company/' + $scope.company.name);
        },
        function (error) {
          $scope.formData.errorMessage = error.data.error.message;
          $scope.formData.error = true;
          $scope.loading.main = false;
          $scope.loading.perks = false;
        }
      );
    };

    /**
     * Prepares the formData parameter object to correct keys in order to push to API
     * @param formData
     */
    function prepForPush(formData) {
      // Validate pay input - grabs the pure currency as a string, else null
      var parsedPay = null;
      if (formData.pay !== "") {
        var isValidPay = formData.pay.search(/^\$?[\d,]+(\.\d*)?$/) >= 0;
        if (isValidPay) {
          parsedPay = formData.pay.replace(/[^0-9\.]/g, '');
        }
      }

      // Set job title, set to null if empty
      var parsedJobTitle = null;
      if (formData.jobTitle !== "") {
        parsedJobTitle = formData.jobTitle;
      }

      // Set perks list from
      var perksList = [];
      angular.forEach(formData.perks, function (perk) {
        perksList.push(perk);
      });

      // Set majors list
      var majorsList = [];
      majorsList.push($('#majorSearch').search('get result').id);

      // Set location
      var tempLocation = $('#locationSearch').search('get result').id;

      return {
        anonymous: formData.anonymous,
        returnOffer: formData.returnOffer,
        recommend: formData.recommend,
        description: formData.description,
        overallRating: formData.overallRating,
        cultureRating: formData.cultureRating,
        difficultyRating: formData.cultureRating,
        pay: parsedPay,
        userId: formData.userId,
        payTypeId: formData.payTypeId,
        jobTitle: parsedJobTitle,

        perks: perksList,
        majors: majorsList,
        location: tempLocation
      };
    }


    /************************************************************************************
     * WIZARD CONTROLLING FUNCTIONS
     ************************************************************************************/
    /**
     * Wizard variables.
     * @type {{currStep: string, s1: string, s2: string, s3: string}}
     */
    $scope.wizard = {
      currStep: "wizardStepOne",
      s1: "wizardStepOne",
      s2: "wizardStepTwo",
      s3: "wizardStepThree"
    };


    /************************************************************************************
     * ON DOCUMENT READY FUNCTIONS & SEMANTIC SETUP
     ************************************************************************************/
      // On document ready, wait half a second and to init Semantic UI elements.
    angular.element(document).ready(function () {
      // Delay to wait for angular to
      setTimeout(setupSemantic, 100);
    });

    /**
     * Runs once on document ready. Set up Semantic UI elements
     */
    function setupSemantic() {
      $('.ui.accordion').accordion();
      $('.ui.selection.dropdown').dropdown();
      $('#payType').dropdown();
      $('.rating').rating({
        /* see http://bit.ly/1M0OaL9 of why we need to do this */
        onRate: function (val) {
          $scope.$apply(function () {
            var ratings = $('.rating').rating('get rating');
            $scope.formData.overallRating = ratings[0];
            $scope.formData.cultureRating = ratings[1];
            $scope.formData.difficultyRating = ratings[2];
          });
        }
      });
      $('#privacyCheckbox').checkbox({
        onChange: function () {
          /* see http://bit.ly/1M0OaL9 of why we need to do this */
          $scope.$apply(function () {
            $scope.formData.anonymous = !$scope.formData.anonymous;
          });
        }
      });
      $('#returnOfferCheckbox').checkbox({
        onChange: function () {
          /* see http://bit.ly/1M0OaL9 of why we need to do this */
          $scope.$apply(function () {
            $scope.formData.returnOffer = !$scope.formData.returnOffer;
          });
        }
      });
      $('#recommendCheckbox').checkbox({
        onChange: function () {
          /* see http://bit.ly/1M0OaL9 of why we need to do this */
          $scope.$apply(function () {
            $scope.formData.recommend = !$scope.formData.recommend;
          });
        }
      });


      $('#locationSearch').search({
        apiSettings: {
          //TODO: not hardcode url, use another system for searching
          url: "https://ratemycoop.io/api/v1/Cities/search?query={query}"
        },
        searchFullText: false,
        searchFields: ['title'],
        maxResults: 10
      });

      // Form validation for the final submission
      $('#reviewForm').form(
        {
          major: {
            identifier: 'majorSearchInput',
            rules: [{
              type: 'empty',
              prompt: 'Please enter your major'
            }]
          },
          city: {
            identifier: 'locationSearchInput',
            rules: [{
              type: 'empty',
              prompt: 'Please enter your major'
            }]
          },
          pay: {
            identifier: 'payInput',
            rules: [
              {
                type: 'empty',
                prompt: 'Please enter a valid pay'
              },
              {
                type: 'length[2]'
              }
            ]
          },
          payType: {
            identifier: 'payTypeInput',
            prompt: 'prompt'
          }
        },
        {
          on: 'blur',
          keyboardShortcuts: false
        }
      );
    }


  });
