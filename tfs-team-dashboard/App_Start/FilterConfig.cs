using System.Web;
using System.Web.Mvc;

namespace tfs_team_dashboard
{
    public class FilterConfig
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
        }
    }
}