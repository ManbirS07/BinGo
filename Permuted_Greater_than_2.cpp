#include <bits/stdc++.h>
using namespace std;

#define pb push_back
#define endl ("\n")
#define pi (3.141592653589)
#define int long long
#define float double
#define pb push_back
#define mp make_pair
#define ff first
#define ss second
#define all(c) cc.begin(), c.end()
#define mini(a, b, c) min(c, min(a, b))
#define mini2(a, b, c, d) min(d, min(c, min(a, b))) 
#define rrep(i,s,n) for(int i=n-1;i>=s;i--)
#define f(i,n) for(int i=0;i<n;i++)
#define fast ios_base::sync_with_stdio(false), cin.tie(nullptr), cout.tie(nullptr);
#define scin(str) getline(cin, str)

#define debug(x) cerr << #x << " = " << x << endl
#define debug2(x, y) cerr << #x << " = " << x << ", " << #y << " = " << y << endl

using vec = vector<int>;
using pii=pair<int,int>;
using mapi=map<int,int>;
using si=set<int>;

const int mod = 1e9+7;
const int dx[4]{1, 0, -1, 0}, dy[4]{0, 1, 0, -1};
const int N=2e5+5;

int32_t main(){
    fast

    int t = 1;
    cin >> t;
    while(t--){
        int x, y, z;
        cin >> x >> y >> z;

        if(y == 0){
            if(x == 0 || z == 0) cout << "Yes\n";
            else cout << "No\n";
        }
        else{
            if(x <= y + 1 && z <= y + 1) cout << "Yes\n";
            else cout << "No\n";
        }
    }
    return 0;
}
