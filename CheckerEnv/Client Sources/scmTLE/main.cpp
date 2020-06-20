#include <fstream>

using namespace std;

ifstream cin("scm.in");
ofstream cout("scm.out");

const int NMAX = 1e5;

int N;
int a[NMAX + 2], best[NMAX + 2];

int main()
{
    cin >> N;

    for(int i = 1; i <= N; i++)
        cin >> a[i];

    best[1] = 1;

    for(int i = 2; i <= N; i++)
        for(int j = 1; j < i; j++)
            if(a[j] <= a[i])
                best[i] = max(best[i], 1 + best[j]);

    int ans = best[1];
    for(int i = 2; i <= N; i++)
        ans = max(ans, best[i]);

    cout << ans << '\n';

    return 0;
}
