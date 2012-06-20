<<<<<<< HEAD
(($) ->
  $(document).ready ->
    eles = $('script').filter -> /widget/.test $(@).attr 'src'
    $(eles).each ->
      $(@).attr 'data-public-key', 'ABCDEF'
)(jQuery)
=======
jasmine.getFixtures().fixturesPath = '/fixtures'
>>>>>>> uploadcare/v0.0.3
