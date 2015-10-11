function MainCtrl($scope, $localStorage) {

  var vm = this;

  vm.moscowFilterOptions = [
    {title: "Musts", value: ['m']},
    {title: "Musts + shoulds", value: ['m', 's']},
    {title: "Musts + shoulds + coulds", value: ['m', 's', 'c']},
    {title: "Musts + shoulds + coulds + wont's", value :['m', 's', 'c', 'w']}
  ];

  vm.stories = $localStorage.stories || [{},{},{},{},{}];
  vm.hourlyRate = $localStorage.hourlyRate || 95.00;
  vm.filter = {
    "moscow": vm.moscowFilterOptions[0].value,
    "in_out": false
  };

  vm.suppliments = $localStorage.suppliments || {
    pm: 10,
    sa: 7.5,
    ux: 7.5,
    acceptance: 10,
    uat: 10,
    integration: 0,
    testing: 10
  };



  $scope.$watch(function () {
    return [vm.stories, vm.filter, vm.hourlyRate, vm.suppliments];
  }, function (newValue) {
    vm.updateValues();
    vm.saveValues();
  }, true);

  vm.updateValues = function () {

    var stories = vm.stories;

    // Horrific logic warning! When unchecked only include stories marked "In".
    if (!vm.filter.in_out) {
      stories = _.filter(stories, {in_out: 'In'});
    }

    stories = _.filter(stories, function (story) {
      return _.indexOf(vm.filter.moscow, story.moscow.toLowerCase()) !== -1;
    });

    var estimates = _(stories).pluck('estimate');

    var estimated = {
      ux: _.sum(estimates.pluck('ux').value()),
      design: _.sum(estimates.pluck('design').value()),
      frontEnd: _.sum(estimates.pluck('frontEnd').value()),
      dev: _.sum(estimates.pluck('dev').value())
    };

    var supplements = {
      frontEnd: {
        acceptance: estimated.frontEnd * (vm.suppliments.acceptance / 100),
        uat: estimated.frontEnd * (vm.suppliments.uat / 100),
        integration: estimated.frontEnd * (vm.suppliments.integration / 100),
        testing: estimated.frontEnd * (vm.suppliments.testing / 100)
      },
      dev: {
        acceptance: estimated.dev * (vm.suppliments.acceptance / 100),
        uat: estimated.dev * (vm.suppliments.uat / 100),
        integration: estimated.dev * (vm.suppliments.integration / 100),
        testing: estimated.dev * (vm.suppliments.testing / 100)
      }
    };

    var subTotal = {
      ux: estimated.ux,
      design: estimated.design,
      frontEnd: estimated.frontEnd + _.sum(supplements.frontEnd),
      dev: estimated.dev + _.sum(supplements.dev)
    };
    subTotal.total = _.sum(subTotal);

    supplements.ux = subTotal.total * (vm.suppliments.ux / 100);
    supplements.pm = subTotal.total * (vm.suppliments.pm / 100);
    supplements.sa = subTotal.total * (vm.suppliments.sa / 100);


    var total = {
      ux: subTotal.ux + supplements.ux,
      design: subTotal.design,
      frontEnd: subTotal.frontEnd,
      dev: subTotal.dev,
      pm: supplements.pm,
      sa: supplements.sa
    };
    total.total = _.sum(total);

    vm.hours = {
      estimated: estimated,
      suppliments: supplements,
      total: total
    }
  };

  vm.saveValues = _.throttle(function(){
    $localStorage.stories = vm.stories;
    $localStorage.hourlyRate = vm.hourlyRate;
    $localStorage.suppliments = vm.suppliments;
  }, 2000);

  // To format the cell, we'll have to provide a callback function, that each column is configured to use.
  // then, we'll be able to read columnN and add a format if it's in the filter.
  // We can highlight the rows using this strategy.
}

angular
  .module('app', ['ngHandsontable', 'ngStorage'])
  .controller('MainCtrl', MainCtrl);
