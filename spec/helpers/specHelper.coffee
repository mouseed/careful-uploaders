(($) ->
  $(document).ready ->
    eles = $('script').filter -> /widget/.test $(@).attr 'src'
    $(eles).each ->
      $(@).attr 'data-public-key', 'ABCDEF'
)(jQuery)