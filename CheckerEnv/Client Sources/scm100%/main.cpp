#include <fstream>

using namespace std;

ifstream fin("scm.in");
ofstream fout("scm.out");

const int NMAX = 1e5;

int N, v[NMAX + 5];
int m, t[NMAX + 5];

int BS(int val)
{
    int st = 1, dr = m, mid;

    while (st <= dr)
    {

        mid = (st + dr) >> 1;

        if (val > v[t[mid]])
            st = mid + 1;
        else
            dr = mid - 1;
    }

    return st;
}

int main()
{
    fin >> N;
    for (int i = 1; i <= N; i++)
        fin >> v[i];

    t[1] = 1, m = 1;

    for (int i = 2; i <= N; i++)
    {

        int k = BS(v[i]);
        m = max(m, k);
        t[k] = i;
    }

    fout << m << '\n';

    return 0;
}
