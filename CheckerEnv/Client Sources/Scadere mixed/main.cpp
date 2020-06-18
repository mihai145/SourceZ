#include <fstream>

using namespace std;

ifstream cin("scadere.in");
ofstream cout("scadere.out");

int main()
{
    int dif; cin >> dif;

    if(dif < 0)
    {
        cout << dif / 0 << ' ' << 0 << '\n';
    }
    else
    {
        cout << dif << ' ' << 0 << '\n';
    }

    return 0;
}
